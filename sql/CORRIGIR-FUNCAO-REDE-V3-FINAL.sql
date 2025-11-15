-- ============================================
-- 🔧 CORRIGIR FUNÇÃO get_community_network() - V3 FINAL
-- ============================================
-- Problema: member_id ambíguo causando erro 400
-- Solução: Reescrever função SEM ambiguidade

-- ============================================
-- 1. DROPAR E RECRIAR FUNÇÃO
-- ============================================

DROP FUNCTION IF EXISTS get_community_network(UUID) CASCADE;

-- Função SIMPLES que retorna toda a rede de indicações
CREATE OR REPLACE FUNCTION get_community_network(user_id UUID)
RETURNS TABLE(member_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network_tree AS (
    -- Caso base: o próprio usuário
    SELECT
      p.id,
      p.referral_code,
      p.referred_by
    FROM profiles p
    WHERE p.id = user_id

    UNION

    -- Passo 1: Subir na árvore (quem indicou você)
    SELECT
      p.id,
      p.referral_code,
      p.referred_by
    FROM profiles p
    INNER JOIN network_tree nt ON p.referral_code = nt.referred_by

    UNION

    -- Passo 2: Descer na árvore (quem você indicou)
    SELECT
      p.id,
      p.referral_code,
      p.referred_by
    FROM profiles p
    INNER JOIN network_tree nt ON p.referred_by = nt.referral_code
  )
  SELECT DISTINCT network_tree.id
  FROM network_tree;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_community_network IS 'Retorna todos os membros da rede de indicações (sobe e desce na árvore)';

-- ============================================
-- 2. RECRIAR VIEW community_stats
-- ============================================

DROP VIEW IF EXISTS community_stats CASCADE;

CREATE OR REPLACE VIEW community_stats AS
SELECT
  p.id as aluno_id,
  p.full_name,
  (SELECT COUNT(DISTINCT member_id) - 1 FROM get_community_network(p.id)) as network_size,
  get_yearly_check_ins(p.id) as yearly_check_ins,
  get_current_streak(p.id) as current_streak,
  (SELECT COUNT(*) FROM community_posts WHERE aluno_id = p.id) as total_posts,
  (
    SELECT COUNT(*)
    FROM community_likes cl
    INNER JOIN community_posts cp ON cl.post_id = cp.id
    WHERE cp.aluno_id = p.id
  ) as total_likes_received
FROM profiles p
WHERE p.role = 'aluno';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Função corrigida SEM ambiguidade:
-- ✅ Retorna você + quem te indicou + quem você indicou
-- ✅ Sobe e desce na árvore completa
-- ✅ Sem erro de coluna ambígua
