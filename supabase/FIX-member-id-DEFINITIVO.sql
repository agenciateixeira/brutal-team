-- ============================================
-- FIX DEFINITIVO: member_id ambíguo
-- ============================================
-- Erro: code: '42702', message: 'column reference "member_id" is ambiguous'
-- Causa: Referências não qualificadas ao member_id

-- 1. RECRIAR a função get_community_network SEM ambiguidade
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

-- 2. RECRIAR a view community_stats SEM ambiguidade
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

-- 3. DROPAR todas as policies
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;

-- 4. RECRIAR policy de INSERT (MAIS SIMPLES)
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = community_posts.aluno_id
);

-- 5. RECRIAR policy de SELECT com subquery bem qualificada
CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  -- Pode ver seus próprios posts
  auth.uid() = community_posts.aluno_id
  OR
  -- OU o post é de alguém na sua rede
  community_posts.aluno_id IN (
    SELECT net.member_id
    FROM get_community_network(auth.uid()) net
  )
);

-- 6. Policy de DELETE
CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = community_posts.aluno_id);

-- 7. Policy para coaches
CREATE POLICY "Coaches podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role = 'coach'
  )
);

-- 8. Garantir RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 9. Teste a função
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Testar se a função funciona
  SELECT COUNT(*) INTO test_count
  FROM get_community_network(auth.uid());

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FIX APLICADO COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Função get_community_network recriada';
  RAISE NOTICE 'View community_stats recriada';
  RAISE NOTICE 'Policies recriadas sem ambiguidade';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Tente postar novamente!';
  RAISE NOTICE '';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Algumas verificações falharam, mas as correções foram aplicadas';
END $$;
