-- ============================================
-- CORRIGIR ERRO: member_id ambíguo
-- ============================================
-- O erro ocorre porque a view community_stats ou as policies
-- estão com referências ambíguas ao member_id

-- 1. Recriar a view community_stats com qualificação correta
DROP VIEW IF EXISTS community_stats CASCADE;

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

-- 2. Recriar policies com subqueries mais claras
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;

-- Policy de SELECT para alunos
CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM get_community_network(auth.uid()) net
    WHERE net.member_id = community_posts.aluno_id
  )
);

-- Policy de INSERT para alunos (SEM verificação de rede, só próprio ID)
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (auth.uid() = community_posts.aluno_id);

-- Policy de DELETE para alunos
CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = community_posts.aluno_id);

-- Policy para coaches
CREATE POLICY "Coaches podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Correção aplicada!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies recriadas:';
  RAISE NOTICE '  - Alunos podem ver posts da sua rede';
  RAISE NOTICE '  - Alunos podem criar posts';
  RAISE NOTICE '  - Alunos podem deletar seus posts';
  RAISE NOTICE '  - Coaches podem ver todos os posts';
  RAISE NOTICE '';
  RAISE NOTICE 'View community_stats recriada sem ambiguidade';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Teste agora postando na comunidade!';
END $$;
