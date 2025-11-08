-- ============================================
-- 🔧 CORRIGIR FUNÇÃO get_community_network()
-- ============================================
-- Problema: Função retorna apenas descendentes (quem você indicou)
-- Solução: Retornar TODA a rede (quem te indicou + todos da mesma árvore)

-- ============================================
-- SUBSTITUIR FUNÇÃO (sem dropar)
-- ============================================
-- Retorna TODOS os membros da rede de indicações:
-- 1. Sobe até a raiz da árvore (quem te indicou, e quem indicou ele...)
-- 2. Desce pegando todos os descendentes da raiz

CREATE OR REPLACE FUNCTION get_community_network(user_id UUID)
RETURNS TABLE(member_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE
  -- PASSO 1: Subir até a raiz da árvore
  upward_tree AS (
    SELECT id, referral_code, referred_by
    FROM profiles
    WHERE id = user_id

    UNION

    SELECT p.id, p.referral_code, p.referred_by
    FROM profiles p
    INNER JOIN upward_tree ut ON p.referral_code = ut.referred_by
  ),
  -- Pegar a raiz (quem não foi indicado por ninguém na árvore)
  root_node AS (
    SELECT id, referral_code
    FROM upward_tree
    WHERE referred_by IS NULL
    OR referred_by NOT IN (SELECT referral_code FROM profiles)
    ORDER BY id
    LIMIT 1
  ),
  -- PASSO 2: Descer pegando todos os descendentes da raiz
  full_tree AS (
    SELECT id as member_id, referral_code
    FROM root_node

    UNION

    SELECT p.id as member_id, p.referral_code
    FROM profiles p
    INNER JOIN full_tree ft ON p.referred_by = ft.referral_code
  )
  SELECT DISTINCT member_id FROM full_tree;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- COMENTÁRIO
-- ============================================

COMMENT ON FUNCTION get_community_network IS 'Retorna TODA a rede de indicações: sobe até a raiz e desce pegando todos os membros da árvore';

-- ============================================
-- TESTE
-- ============================================
-- Para testar, execute:
-- SELECT * FROM get_community_network('SEU_USER_ID_AQUI');
-- Deve retornar TODOS da sua rede (quem te indicou + todos que foram indicados)

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Agora a função retorna TODA a rede, não só descendentes
