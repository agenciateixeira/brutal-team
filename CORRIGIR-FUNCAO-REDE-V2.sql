-- ============================================
-- 🔧 CORRIGIR FUNÇÃO get_community_network() - VERSÃO 2
-- ============================================
-- Problema: Não pode usar CREATE OR REPLACE por causa das dependências
-- Solução: DROP CASCADE + recriar tudo

-- ============================================
-- 1. DROPAR FUNÇÃO E DEPENDÊNCIAS
-- ============================================

DROP FUNCTION IF EXISTS get_community_network(UUID) CASCADE;

-- Isso vai dropar:
-- - A função
-- - As policies que usam ela
-- - As views que usam ela

-- ============================================
-- 2. RECRIAR FUNÇÃO COMPLETA
-- ============================================

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
-- 3. RECRIAR POLICIES DE POSTS
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;

-- Alunos podem ver próprios posts + posts da rede (EXCLUSIVO - coaches NÃO veem)
CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Alunos podem criar posts
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (auth.uid() = aluno_id);

-- Alunos podem deletar posts
CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = aluno_id);

-- ============================================
-- 4. RECRIAR POLICIES DE LIKES
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem remover curtidas" ON community_likes;
DROP POLICY IF EXISTS "Coaches podem ver todas as curtidas" ON community_likes;

-- Alunos podem ver curtidas de posts da rede
CREATE POLICY "Alunos podem ver curtidas da rede"
ON community_likes FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem curtir posts da rede
CREATE POLICY "Alunos podem curtir posts da rede"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem remover suas curtidas
CREATE POLICY "Alunos podem remover curtidas"
ON community_likes FOR DELETE
USING (auth.uid() = aluno_id);

-- ============================================
-- 5. RECRIAR POLICIES DE COMMENTS
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem deletar comentários" ON community_comments;
DROP POLICY IF EXISTS "Coaches podem ver todos os comentários" ON community_comments;

-- Alunos podem ver comentários da rede
CREATE POLICY "Alunos podem ver comentários da rede"
ON community_comments FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem comentar posts da rede
CREATE POLICY "Alunos podem comentar posts da rede"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem deletar seus comentários
CREATE POLICY "Alunos podem deletar comentários"
ON community_comments FOR DELETE
USING (auth.uid() = aluno_id);

-- ============================================
-- 6. RECRIAR POLICIES DE CHECK-INS
-- ============================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver check-ins da rede" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem criar check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Coaches podem ver todos check-ins" ON community_check_ins;

-- Alunos podem ver check-ins da rede
CREATE POLICY "Alunos podem ver check-ins da rede"
ON community_check_ins FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Alunos podem criar check-ins
CREATE POLICY "Alunos podem criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (auth.uid() = aluno_id);

-- ============================================
-- 7. RECRIAR VIEW community_stats
-- ============================================

CREATE OR REPLACE VIEW community_stats AS
SELECT
  p.id as aluno_id,
  p.full_name,
  COUNT(DISTINCT network.member_id) - 1 as network_size,
  get_yearly_check_ins(p.id) as yearly_check_ins,
  get_current_streak(p.id) as current_streak,
  (
    SELECT COUNT(*)
    FROM community_posts cp
    WHERE cp.aluno_id = p.id
  ) as total_posts,
  (
    SELECT COUNT(*)
    FROM community_likes cl
    INNER JOIN community_posts cp ON cl.post_id = cp.id
    WHERE cp.aluno_id = p.id
  ) as total_likes_received
FROM profiles p
CROSS JOIN LATERAL get_community_network(p.id) as network
WHERE p.role = 'aluno'
GROUP BY p.id, p.full_name;

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Execute este SQL no Supabase SQL Editor
--
-- Agora a função retorna TODA a rede:
-- ✅ Sobe até a raiz da árvore
-- ✅ Desce pegando todos os membros
-- ✅ Todas as policies foram recriadas
-- ✅ View community_stats recriada
-- 🔒 COMUNIDADE EXCLUSIVA - Coaches NÃO veem posts
-- 🔒 Apenas alunos da mesma rede veem entre si
