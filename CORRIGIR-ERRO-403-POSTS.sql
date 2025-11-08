-- ============================================
-- 🔧 CORRIGIR ERRO 403 AO POSTAR
-- ============================================
-- Problema: Policy de check-ins bloqueia o trigger
-- Solução: Remover policy INSERT de check-ins (trigger cuida)
--          E recriar trigger com SECURITY DEFINER

-- ============================================
-- 1. REMOVER POLICY INSERT DE CHECK-INS
-- ============================================

-- O trigger vai criar check-ins, não precisa de policy INSERT
DROP POLICY IF EXISTS "Alunos criam check-ins" ON community_check_ins;

-- ============================================
-- 2. RECRIAR FUNÇÃO DO TRIGGER COM SECURITY DEFINER
-- ============================================

DROP FUNCTION IF EXISTS create_check_in_on_first_post() CASCADE;

CREATE OR REPLACE FUNCTION create_check_in_on_first_post()
RETURNS TRIGGER
SECURITY DEFINER -- ← Bypass RLS
SET search_path = public
AS $$
DECLARE
  last_check_in TIMESTAMP;
  today_start TIMESTAMP;
BEGIN
  -- Início do dia de hoje (timezone Brasil)
  today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Sao_Paulo');

  -- Buscar último check-in do usuário
  SELECT created_at INTO last_check_in
  FROM community_check_ins
  WHERE aluno_id = NEW.aluno_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nunca fez check-in OU último foi antes de hoje
  IF last_check_in IS NULL OR last_check_in < today_start THEN
    -- Inserir check-in (sem passar pela policy)
    INSERT INTO community_check_ins (aluno_id, date)
    VALUES (NEW.aluno_id, CURRENT_DATE)
    ON CONFLICT (aluno_id, date) DO NOTHING; -- Evita duplicatas
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_check_in_on_first_post IS 'Cria check-in automático no primeiro post do dia (bypass RLS)';

-- ============================================
-- 3. RECRIAR TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trigger_create_check_in ON community_posts;

CREATE TRIGGER trigger_create_check_in
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION create_check_in_on_first_post();

-- ============================================
-- 4. VERIFICAR TRIGGER E POLICIES
-- ============================================

-- Ver se trigger foi criado
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'community_posts';

-- Ver policies atuais de check-ins
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'community_check_ins';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora deve funcionar:
-- ✅ Trigger com SECURITY DEFINER (bypass RLS)
-- ✅ Sem policy INSERT bloqueando
-- ✅ Posts funcionam normalmente
-- ✅ Check-in criado automaticamente
