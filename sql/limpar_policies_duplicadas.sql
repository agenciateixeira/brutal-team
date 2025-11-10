-- ============================================
-- LIMPAR POLICIES DUPLICADAS
-- ============================================

-- COMMUNITY_POSTS - Manter apenas 1 policy de SELECT
DROP POLICY IF EXISTS "Alunos podem ver posts das suas comunidades" ON community_posts;
DROP POLICY IF EXISTS "Alunos veem posts da rede" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver posts da comunidade pública" ON community_posts;

-- Manter apenas esta:
-- "Alunos podem ver posts da comunidade" (já existe)

-- Verificar resultado
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'community_posts'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Deve mostrar apenas 1 policy de SELECT
