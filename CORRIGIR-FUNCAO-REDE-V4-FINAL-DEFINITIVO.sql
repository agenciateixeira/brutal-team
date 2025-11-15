-- ============================================
-- 🔧 CORRIGIR FUNÇÃO get_community_network() - V4 DEFINITIVO
-- ============================================
-- Problema: "recursive reference must not appear within its non-recursive term"
-- Causa: Uso incorreto de UNION na recursão
-- Solução: Estrutura correta com base + recursão combinada

-- ============================================
-- 1. DROPAR E RECRIAR FUNÇÃO
-- ============================================

DROP FUNCTION IF EXISTS get_community_network(UUID) CASCADE;

-- Função que retorna toda a rede de indicações (sobe e desce)
CREATE OR REPLACE FUNCTION get_community_network(user_id UUID)
RETURNS TABLE(member_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network_tree AS (
    -- PARTE BASE: Apenas o próprio usuário
    SELECT
      p.id,
      p.referral_code,
      p.referred_by
    FROM profiles p
    WHERE p.id = user_id

    UNION

    -- PARTE RECURSIVA: Sobe E desce na árvore
    SELECT
      p.id,
      p.referral_code,
      p.referred_by
    FROM profiles p
    INNER JOIN network_tree nt ON (
      -- Subir: quem indicou você
      p.referral_code = nt.referred_by
      OR
      -- Descer: quem você indicou
      p.referred_by = nt.referral_code
    )
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
-- Função corrigida com estrutura CORRETA de recursão:
-- ✅ PARTE BASE: Você
-- ✅ PARTE RECURSIVA: Sobe OU desce (combinado com OR)
-- ✅ Retorna toda a rede de indicações
-- ✅ Sem erro de recursão
