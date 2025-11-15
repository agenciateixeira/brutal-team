-- ============================================
-- FIX CRÍTICO: ADICIONAR COACH_ID E ISOLAR DADOS POR COACH (V3)
-- ============================================
-- Este script corrige o vazamento de dados entre coaches
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- V3: Corrigido syntax error com RAISE NOTICE
-- ============================================

-- ============================================
-- 1. ADICIONAR COLUNA COACH_ID SE NÃO EXISTIR
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON profiles(coach_id);

-- ============================================
-- 2. DROPAR TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view all alunos" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can update their alunos" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their own alunos" ON profiles;
DROP POLICY IF EXISTS "Alunos can view own profile and their coach" ON profiles;
DROP POLICY IF EXISTS "Coaches can update their own alunos" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Treinos
DROP POLICY IF EXISTS "Coaches can view all treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches can view their alunos treinos" ON treinos;
DROP POLICY IF EXISTS "Users can view their treinos" ON treinos;

-- Dietas
DROP POLICY IF EXISTS "Coaches can view all dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches can view their alunos dietas" ON dietas;
DROP POLICY IF EXISTS "Users can view their dietas" ON dietas;

-- Mensagens
DROP POLICY IF EXISTS "Coaches can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Fotos
DROP POLICY IF EXISTS "Coaches can view all photos" ON progress_photos;
DROP POLICY IF EXISTS "Users can view their photos" ON progress_photos;

-- Protocolos
DROP POLICY IF EXISTS "Coaches can view all protocols" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Users can view their protocols" ON protocolos_hormonais;

-- Weekly summary
DROP POLICY IF EXISTS "Coaches can view all summaries" ON weekly_summary;
DROP POLICY IF EXISTS "Users can view their summaries" ON weekly_summary;

-- Anamnese
DROP POLICY IF EXISTS "Coaches can view all anamnese" ON anamnese_responses;
DROP POLICY IF EXISTS "Users can view their anamnese" ON anamnese_responses;

-- ============================================
-- 3. CRIAR NOVAS POLÍTICAS RLS SEGURAS
-- ============================================

-- ===== PROFILES =====

CREATE POLICY "Coaches can view their own alunos"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
      AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Alunos can view own profile and their coach"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id = (SELECT coach_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can update their own alunos"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
      AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ===== TREINOS =====

CREATE POLICY "Coaches can view their alunos treinos"
  ON treinos FOR SELECT
  USING (
    auth.uid() = aluno_id
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = treinos.aluno_id
    )
  );

-- ===== DIETAS =====

CREATE POLICY "Coaches can view their alunos dietas"
  ON dietas FOR SELECT
  USING (
    auth.uid() = aluno_id
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = dietas.aluno_id
    )
  );

-- ===== MENSAGENS =====

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR (
      auth.uid() IN (
        SELECT coach_id FROM profiles WHERE id = messages.aluno_id
      )
    )
  );

-- ===== PROGRESS PHOTOS =====

CREATE POLICY "Users can view their photos"
  ON progress_photos FOR SELECT
  USING (
    auth.uid() = aluno_id
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = progress_photos.aluno_id
    )
  );

-- ===== PROTOCOLOS =====

CREATE POLICY "Users can view their protocols"
  ON protocolos_hormonais FOR SELECT
  USING (
    auth.uid() = aluno_id
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = protocolos_hormonais.aluno_id
    )
  );

-- ===== WEEKLY SUMMARY =====

CREATE POLICY "Users can view their summaries"
  ON weekly_summary FOR SELECT
  USING (
    auth.uid() = aluno_id
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = weekly_summary.aluno_id
    )
  );

-- ===== ANAMNESE =====

CREATE POLICY "Users can view their anamnese"
  ON anamnese_responses FOR SELECT
  USING (
    temp_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE email = anamnese_responses.temp_email
    )
  );

-- ============================================
-- 4. CRIAR FUNÇÃO PARA VINCULAR ALUNO AO COACH
-- ============================================

CREATE OR REPLACE FUNCTION link_aluno_to_coach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'aluno' AND NEW.coach_id IS NULL THEN
    UPDATE profiles
    SET coach_id = (
      SELECT coach_id
      FROM invite_tokens
      WHERE used_by = NEW.id
        AND used = true
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_link_aluno_to_coach ON profiles;
CREATE TRIGGER trigger_link_aluno_to_coach
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_aluno_to_coach();

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'coach_id'
  ) THEN
    RAISE NOTICE '✅ coach_id ADICIONADO COM SUCESSO';
  ELSE
    RAISE EXCEPTION '❌ ERRO: coach_id NÃO FOI ADICIONADO';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Mostrar políticas criadas
SELECT
  tablename,
  COUNT(*) AS total_policies
FROM pg_policies
WHERE tablename IN (
  'profiles',
  'treinos',
  'dietas',
  'messages',
  'progress_photos',
  'protocolos_hormonais',
  'weekly_summary',
  'anamnese_responses'
)
GROUP BY tablename
ORDER BY tablename;
