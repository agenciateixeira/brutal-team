-- ============================================
-- FIX COMPLETO: Comunidade + Posts + Check-ins
-- ============================================
-- Este SQL corrige TODOS os erros de uma vez:
-- - member_id ambíguo (400)
-- - RLS policy check-ins (403)

-- ============================================
-- 1. FUNÇÃO get_community_network
-- ============================================

DROP FUNCTION IF EXISTS get_community_network(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_community_network(user_id UUID)
RETURNS TABLE (member_id UUID, level INT) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network AS (
    -- Nível 0: o próprio usuário
    SELECT
      user_id as member_id,
      0 as level

    UNION

    -- Nível 1: pessoas que o usuário indicou
    SELECT DISTINCT
      r.referred_id as member_id,
      1 as level
    FROM referrals r
    WHERE r.referrer_id = user_id
    AND r.status = 'active'

    UNION

    -- Nível 2: pessoas indicadas pelos indicados do usuário
    SELECT DISTINCT
      r2.referred_id as member_id,
      2 as level
    FROM referrals r1
    INNER JOIN referrals r2 ON r2.referrer_id = r1.referred_id
    WHERE r1.referrer_id = user_id
    AND r1.status = 'active'
    AND r2.status = 'active'
  )
  SELECT
    n.member_id,
    n.level
  FROM network n;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 2. VIEW community_stats
-- ============================================

DROP VIEW IF EXISTS community_stats CASCADE;

CREATE OR REPLACE VIEW community_stats AS
SELECT
  p.id as aluno_id,
  p.full_name,
  COALESCE((
    SELECT COUNT(DISTINCT net.member_id) - 1
    FROM get_community_network(p.id) net
  ), 0) as network_size,
  COALESCE(get_yearly_check_ins(p.id), 0) as yearly_check_ins,
  COALESCE(get_current_streak(p.id), 0) as current_streak,
  COALESCE((
    SELECT COUNT(*)
    FROM community_posts cp
    WHERE cp.aluno_id = p.id
  ), 0) as total_posts,
  COALESCE((
    SELECT COUNT(*)
    FROM community_likes cl
    INNER JOIN community_posts cp ON cl.post_id = cp.id
    WHERE cp.aluno_id = p.id
  ), 0) as total_likes_received
FROM profiles p
WHERE p.role = 'aluno';

-- ============================================
-- 3. POLICIES: community_posts
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;

CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (auth.uid() = community_posts.aluno_id);

CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  auth.uid() = community_posts.aluno_id
  OR
  community_posts.aluno_id IN (
    SELECT net.member_id
    FROM get_community_network(auth.uid()) net
  )
);

CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = community_posts.aluno_id);

CREATE POLICY "Coaches podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role = 'coach'
  )
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLICIES: community_check_ins
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver seus check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem criar check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem ver check-ins da rede" ON community_check_ins;
DROP POLICY IF EXISTS "Coaches podem ver todos os check-ins" ON community_check_ins;

CREATE POLICY "Alunos podem criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (auth.uid() = community_check_ins.aluno_id);

CREATE POLICY "Alunos podem ver seus check-ins"
ON community_check_ins FOR SELECT
USING (auth.uid() = community_check_ins.aluno_id);

CREATE POLICY "Alunos podem ver check-ins da rede"
ON community_check_ins FOR SELECT
USING (
  community_check_ins.aluno_id IN (
    SELECT net.member_id
    FROM get_community_network(auth.uid()) net
  )
);

CREATE POLICY "Coaches podem ver todos os check-ins"
ON community_check_ins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role = 'coach'
  )
);

ALTER TABLE community_check_ins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FIX COMPLETO APLICADO COM SUCESSO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Correções aplicadas:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Função get_community_network:';
  RAISE NOTICE '   ✓ Recriada sem ambiguidade de member_id';
  RAISE NOTICE '';
  RAISE NOTICE '2. View community_stats:';
  RAISE NOTICE '   ✓ Recriada com aliases corretos';
  RAISE NOTICE '';
  RAISE NOTICE '3. Policies community_posts:';
  RAISE NOTICE '   ✓ INSERT: aluno pode criar posts';
  RAISE NOTICE '   ✓ SELECT: pode ver posts próprios + rede';
  RAISE NOTICE '   ✓ DELETE: pode deletar próprios posts';
  RAISE NOTICE '   ✓ Coaches podem ver tudo';
  RAISE NOTICE '';
  RAISE NOTICE '4. Policies community_check_ins:';
  RAISE NOTICE '   ✓ INSERT: aluno pode criar check-ins';
  RAISE NOTICE '   ✓ SELECT: pode ver check-ins próprios + rede';
  RAISE NOTICE '   ✓ Coaches podem ver tudo';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎉 Tudo pronto! Tente postar treino agora!';
  RAISE NOTICE '================================================';
END $$;
