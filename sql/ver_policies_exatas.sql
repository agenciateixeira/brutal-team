-- Ver EXATAMENTE qual é o filtro das policies
SELECT
  tablename,
  policyname,
  cmd,
  qual::text as filtro_completo,
  with_check::text as check_completo
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
