-- ============================================
-- FIX CRÍTICO: ADICIONAR COACH_ID E ISOLAR DADOS POR COACH (V2)
-- ============================================
-- Este script corrige o vazamento de dados entre coaches
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- V2: Corrigido para dropar políticas existentes sem erros
-- ============================================

-- ============================================
-- 1. ADICIONAR COLUNA COACH_ID SE NÃO EXISTIR
-- ============================================

-- Adicionar coach_id à tabela profiles (FK para o coach responsável)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON profiles(coach_id);

RAISE NOTICE '✅ Coluna coach_id adicionada com sucesso';

-- ============================================
-- 2. DROPAR TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Dropar políticas da tabela profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view all alunos" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can update their alunos" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their own alunos" ON profiles;
DROP POLICY IF EXISTS "Alunos can view own profile and their coach" ON profiles;
DROP POLICY IF EXISTS "Coaches can update their own alunos" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Dropar políticas de treinos
DROP POLICY IF EXISTS "Coaches can view all treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches can view their alunos treinos" ON treinos;
DROP POLICY IF EXISTS "Users can view their treinos" ON treinos;

-- Dropar políticas de dietas
DROP POLICY IF EXISTS "Coaches can view all dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches can view their alunos dietas" ON dietas;
DROP POLICY IF EXISTS "Users can view their dietas" ON dietas;

-- Dropar políticas de mensagens
DROP POLICY IF EXISTS "Coaches can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Dropar políticas de fotos
DROP POLICY IF EXISTS "Coaches can view all photos" ON progress_photos;
DROP POLICY IF EXISTS "Users can view their photos" ON progress_photos;

-- Dropar políticas de protocolos
DROP POLICY IF EXISTS "Coaches can view all protocols" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Users can view their protocols" ON protocolos_hormonais;

-- Dropar políticas de weekly summary
DROP POLICY IF EXISTS "Coaches can view all summaries" ON weekly_summary;
DROP POLICY IF EXISTS "Users can view their summaries" ON weekly_summary;

-- Dropar políticas de anamnese
DROP POLICY IF EXISTS "Coaches can view all anamnese" ON anamnese_responses;
DROP POLICY IF EXISTS "Users can view their anamnese" ON anamnese_responses;

RAISE NOTICE '✅ Políticas antigas removidas';

-- ============================================
-- 3. CRIAR NOVAS POLÍTICAS RLS SEGURAS
-- ============================================

-- ===== PROFILES =====

-- ✅ Coaches podem ver apenas SEUS alunos
CREATE POLICY "Coaches can view their own alunos"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id -- Ver próprio perfil
    OR (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach') -- Usuário é coach
      AND coach_id = auth.uid() -- Aluno pertence a este coach
    )
  );

-- ✅ Alunos podem ver seu próprio perfil e o perfil do seu coach
CREATE POLICY "Alunos can view own profile and their coach"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id -- Ver próprio perfil
    OR id = (SELECT coach_id FROM profiles WHERE id = auth.uid()) -- Ver perfil do coach
  );

-- ✅ Coaches podem atualizar apenas seus próprios alunos
CREATE POLICY "Coaches can update their own alunos"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id -- Atualizar próprio perfil
    OR (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach')
      AND coach_id = auth.uid()
    )
  );

-- ✅ Todos podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

RAISE NOTICE '✅ Políticas RLS de profiles criadas';

-- ===== TREINOS =====

-- Coaches veem apenas treinos de seus alunos
CREATE POLICY "Coaches can view their alunos treinos"
  ON treinos FOR SELECT
  USING (
    auth.uid() = aluno_id -- Aluno vê próprios treinos
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = treinos.aluno_id
    ) -- Coach vê treinos de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de treinos criadas';

-- ===== DIETAS =====

-- Coaches veem apenas dietas de seus alunos
CREATE POLICY "Coaches can view their alunos dietas"
  ON dietas FOR SELECT
  USING (
    auth.uid() = aluno_id -- Aluno vê próprias dietas
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = dietas.aluno_id
    ) -- Coach vê dietas de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de dietas criadas';

-- ===== MENSAGENS =====

-- Apenas entre coach e aluno vinculados
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id -- Remetente
    OR auth.uid() = receiver_id -- Destinatário
    OR (
      auth.uid() IN (
        SELECT coach_id FROM profiles WHERE id = messages.aluno_id
      ) -- Coach vê mensagens de seus alunos
    )
  );

RAISE NOTICE '✅ Políticas RLS de mensagens criadas';

-- ===== PROGRESS PHOTOS =====

-- Apenas do aluno e seu coach
CREATE POLICY "Users can view their photos"
  ON progress_photos FOR SELECT
  USING (
    auth.uid() = aluno_id -- Aluno vê próprias fotos
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = progress_photos.aluno_id
    ) -- Coach vê fotos de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de progress_photos criadas';

-- ===== PROTOCOLOS =====

-- Apenas do aluno e seu coach
CREATE POLICY "Users can view their protocols"
  ON protocolos_hormonais FOR SELECT
  USING (
    auth.uid() = aluno_id -- Aluno vê próprios protocolos
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = protocolos_hormonais.aluno_id
    ) -- Coach vê protocolos de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de protocolos criadas';

-- ===== WEEKLY SUMMARY =====

-- Apenas do aluno e seu coach
CREATE POLICY "Users can view their summaries"
  ON weekly_summary FOR SELECT
  USING (
    auth.uid() = aluno_id -- Aluno vê próprios resumos
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE id = weekly_summary.aluno_id
    ) -- Coach vê resumos de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de weekly_summary criadas';

-- ===== ANAMNESE =====

-- Apenas do aluno e seu coach
CREATE POLICY "Users can view their anamnese"
  ON anamnese_responses FOR SELECT
  USING (
    temp_email = (SELECT email FROM auth.users WHERE id = auth.uid()) -- Própria anamnese
    OR auth.uid() IN (
      SELECT coach_id FROM profiles WHERE email = anamnese_responses.temp_email
    ) -- Coach vê anamnese de seus alunos
  );

RAISE NOTICE '✅ Políticas RLS de anamnese criadas';

-- ============================================
-- 4. CRIAR FUNÇÃO PARA VINCULAR ALUNO AO COACH NO CADASTRO
-- ============================================

-- Função para vincular aluno ao coach quando usar token de convite
CREATE OR REPLACE FUNCTION link_aluno_to_coach()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um aluno usa um token de convite, vincular ao coach
  IF NEW.role = 'aluno' AND NEW.coach_id IS NULL THEN
    -- Buscar se existe token usado por este aluno
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

-- Criar trigger para executar após insert/update
DROP TRIGGER IF EXISTS trigger_link_aluno_to_coach ON profiles;
CREATE TRIGGER trigger_link_aluno_to_coach
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_aluno_to_coach();

RAISE NOTICE '✅ Trigger de vinculação criado';

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se coach_id foi adicionado
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'coach_id'
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ SUCESSO! coach_id ADICIONADO ✅✅✅';
  ELSE
    RAISE EXCEPTION '❌ ERRO: coach_id NÃO FOI ADICIONADO';
  END IF;
END $$;

-- Contar políticas RLS criadas
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

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Verificar se a tabela acima mostra políticas para todas as tabelas';
  RAISE NOTICE '2. Testar se coaches veem apenas seus próprios alunos';
  RAISE NOTICE '3. Vincular alunos existentes aos seus coaches manualmente se necessário';
  RAISE NOTICE '';
END $$;
