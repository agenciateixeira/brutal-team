-- ============================================
-- REMOVER POLICIES DUPLICADAS
-- ============================================

-- 1. Remover as policies ANTIGAS (manter apenas as novas)
DROP POLICY IF EXISTS "Alunos podem ver comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver membros" ON community_members;

-- 2. Verificar que ficou apenas 1 SELECT policy de cada
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- Deve mostrar apenas:
-- communities | Coaches podem ver comunidade pública | SELECT
-- communities | select_communities_policy | SELECT
-- community_members | Coaches podem ver membros da comunidade pública | SELECT
-- community_members | select_members_policy | SELECT
