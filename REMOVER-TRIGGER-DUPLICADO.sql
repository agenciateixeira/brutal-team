-- ============================================
-- 🔧 REMOVER TRIGGER DUPLICADO
-- ============================================
-- Problema: 2 triggers tentando criar check-ins
-- Solução: Remover o antigo, manter apenas o novo com SECURITY DEFINER

-- ============================================
-- 1. REMOVER TRIGGER ANTIGO E SUA FUNÇÃO
-- ============================================

DROP TRIGGER IF EXISTS trigger_auto_check_in ON community_posts;
DROP FUNCTION IF EXISTS auto_check_in_on_post() CASCADE;

-- ============================================
-- 2. GARANTIR QUE O TRIGGER NOVO EXISTE
-- ============================================

-- Verificar se função existe
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'create_check_in_on_first_post';

-- Se não tiver SECURITY DEFINER, recriar
DROP FUNCTION IF EXISTS create_check_in_on_first_post() CASCADE;

CREATE OR REPLACE FUNCTION create_check_in_on_first_post()
RETURNS TRIGGER
SECURITY DEFINER -- ← IMPORTANTE: Bypass RLS
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
    -- Inserir check-in (bypass RLS com SECURITY DEFINER)
    INSERT INTO community_check_ins (aluno_id, date)
    VALUES (NEW.aluno_id, CURRENT_DATE)
    ON CONFLICT (aluno_id, date) DO NOTHING; -- Evita duplicatas
  END IF;

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
-- 3. VERIFICAR ESTADO FINAL
-- ============================================

-- Ver triggers atuais (deve ter apenas 2 agora)
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'community_posts'
ORDER BY trigger_name;

-- Ver função com SECURITY DEFINER
SELECT
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_name = 'create_check_in_on_first_post';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora deve ter apenas:
-- ✅ 1 trigger: trigger_create_check_in
-- ✅ 1 função: create_check_in_on_first_post (SECURITY DEFINER)
-- ✅ 1 trigger: update_community_posts_updated_at (atualizar updated_at)
-- ❌ Removido: trigger_auto_check_in (duplicado)
