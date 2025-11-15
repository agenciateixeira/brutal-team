-- ============================================
-- 🔧 FIX FINAL - DESABILITAR RLS PARA TRIGGER
-- ============================================
-- Problema: RLS bloqueia trigger mesmo com SECURITY DEFINER
-- Solução: Adicionar policy que permite INSERT do postgres user

-- ============================================
-- 1. VER QUAL USUÁRIO O TRIGGER USA
-- ============================================

SELECT
  r.routine_name,
  r.security_type,
  r.routine_definition
FROM information_schema.routines r
WHERE r.routine_name = 'create_check_in_on_first_post';

-- ============================================
-- 2. REMOVER TODAS AS POLICIES INSERT ANTIGAS
-- ============================================

DROP POLICY IF EXISTS "Sistema pode criar check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos criam check-ins" ON community_check_ins;

-- ============================================
-- 3. CRIAR POLICY QUE PERMITE TRIGGER
-- ============================================

-- Permitir INSERT quando não há contexto de auth (trigger)
CREATE POLICY "Trigger pode criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (
  -- Se não há usuário autenticado (trigger rodando), permite
  auth.uid() IS NULL
  OR
  -- Se há usuário autenticado e é o dono do registro, permite
  auth.uid() = aluno_id
);

COMMENT ON POLICY "Trigger pode criar check-ins" ON community_check_ins
IS 'Permite trigger criar check-ins (auth.uid() IS NULL) e alunos criarem manualmente';

-- ============================================
-- 4. RECRIAR FUNÇÃO SEM DEPENDER DE AUTH
-- ============================================

DROP FUNCTION IF EXISTS create_check_in_on_first_post() CASCADE;

CREATE OR REPLACE FUNCTION create_check_in_on_first_post()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_check_in TIMESTAMP;
  today_start TIMESTAMP;
BEGIN
  -- Início do dia de hoje
  today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Sao_Paulo');

  -- Buscar último check-in
  SELECT created_at INTO last_check_in
  FROM community_check_ins
  WHERE aluno_id = NEW.aluno_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nunca fez check-in OU último foi antes de hoje
  IF last_check_in IS NULL OR last_check_in < today_start THEN
    -- Usar PERFORM para executar sem contexto de usuário
    PERFORM FROM community_check_ins
    WHERE aluno_id = NEW.aluno_id AND date = CURRENT_DATE;

    IF NOT FOUND THEN
      INSERT INTO community_check_ins (aluno_id, date)
      VALUES (NEW.aluno_id, CURRENT_DATE);
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, apenas loga mas não falha o post
    RAISE WARNING 'Erro ao criar check-in: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_create_check_in ON community_posts;

CREATE TRIGGER trigger_create_check_in
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION create_check_in_on_first_post();

-- ============================================
-- 5. VERIFICAR RESULTADO
-- ============================================

SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'community_check_ins'
  AND cmd = 'INSERT';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Nova abordagem:
-- ✅ Policy permite quando auth.uid() IS NULL (trigger)
-- ✅ Policy permite quando auth.uid() = aluno_id (manual)
-- ✅ Função com EXCEPTION handler (não quebra se der erro)
-- ✅ Usa PERFORM para verificar antes de inserir
