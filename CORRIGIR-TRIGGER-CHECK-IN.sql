-- ============================================
-- 🔧 CORRIGIR TRIGGER DE CHECK-IN
-- ============================================
-- Problema: Policy de check-ins bloqueia o trigger
-- Solução: Tornar trigger SECURITY DEFINER (bypass RLS)

-- ============================================
-- 1. VER O TRIGGER ATUAL
-- ============================================

-- Primeiro, vamos ver se existe um trigger de check-in
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'community_posts';

-- ============================================
-- 2. RECRIAR FUNÇÃO DO TRIGGER COM SECURITY DEFINER
-- ============================================

-- Dropar função antiga se existir
DROP FUNCTION IF EXISTS create_check_in_on_first_post() CASCADE;

-- Criar função com SECURITY DEFINER para bypass RLS
CREATE OR REPLACE FUNCTION create_check_in_on_first_post()
RETURNS TRIGGER
SECURITY DEFINER -- ← ISSO FAZ A DIFERENÇA!
SET search_path = public
AS $$
DECLARE
  last_check_in TIMESTAMP;
  today_start TIMESTAMP;
BEGIN
  -- Início do dia de hoje
  today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Sao_Paulo');

  -- Buscar último check-in do usuário
  SELECT created_at INTO last_check_in
  FROM community_check_ins
  WHERE aluno_id = NEW.aluno_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nunca fez check-in OU último foi antes de hoje
  IF last_check_in IS NULL OR last_check_in < today_start THEN
    -- Inserir check-in
    INSERT INTO community_check_ins (aluno_id)
    VALUES (NEW.aluno_id)
    ON CONFLICT DO NOTHING; -- Evita duplicatas
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. RECRIAR TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trigger_create_check_in ON community_posts;

CREATE TRIGGER trigger_create_check_in
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION create_check_in_on_first_post();

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora o trigger roda com SECURITY DEFINER:
-- ✅ Bypass RLS (não precisa passar pelas policies)
-- ✅ Sempre consegue inserir check-in
-- ✅ Posts funcionam normalmente
