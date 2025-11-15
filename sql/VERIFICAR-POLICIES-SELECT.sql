-- ============================================
-- 🔍 VERIFICAR POLICIES DE SELECT
-- ============================================

-- Ver todas as policies de SELECT em community_posts
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'community_posts'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Testar se consegue buscar posts
SELECT
  cp.id,
  cp.caption,
  cp.photo_url,
  cp.created_at,
  p.full_name,
  p.avatar_url
FROM community_posts cp
INNER JOIN profiles p ON cp.aluno_id = p.id
ORDER BY cp.created_at DESC
LIMIT 5;
