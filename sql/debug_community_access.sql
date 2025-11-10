-- ============================================
-- DEBUG: Por que comunidade não aparece?
-- ============================================

-- 1. Ver todos os alunos e se estão na comunidade
SELECT
  p.id,
  p.full_name,
  p.email,
  CASE WHEN cm.aluno_id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as esta_na_comunidade
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 2. Ver policies de communities
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'communities'
ORDER BY policyname;

-- 3. Ver policies de community_members
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'community_members'
ORDER BY policyname;

-- 4. Testar query que a aplicação usa (simular como aluno específico)
-- Substitua o ID pelo ID de um aluno que NÃO está vendo a comunidade
-- Esta query simula o que acontece quando o aluno acessa a página
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = 'COLE_ID_DO_ALUNO_AQUI';

-- 5. Ver quantos membros tem na comunidade pública
SELECT
  COUNT(*) as total_membros
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';
