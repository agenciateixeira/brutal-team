-- ============================================
-- DIAGNOSTICAR PROBLEMA DE ACESSO À COMUNIDADE
-- ============================================

-- 1. Verificar se o aluno está na comunidade
-- SUBSTITUA 'SEU_EMAIL_AQUI' pelo email do aluno com problema
SELECT
  p.id as aluno_id,
  p.email,
  p.full_name,
  p.approved,
  cm.community_id,
  cm.joined_at,
  c.name as community_name,
  c.type as community_type
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
LEFT JOIN communities c ON cm.community_id = c.id
WHERE p.email = 'SEU_EMAIL_AQUI' -- <-- TROQUE AQUI
  AND p.role = 'aluno';

-- 2. Ver todas as comunidades que existem
SELECT * FROM communities;

-- 3. Ver todos os membros da comunidade pública
SELECT
  cm.aluno_id,
  p.email,
  p.full_name,
  cm.joined_at
FROM community_members cm
JOIN profiles p ON cm.aluno_id = p.id
WHERE cm.community_id = '00000000-0000-0000-0000-000000000001'
ORDER BY cm.joined_at DESC;

-- 4. Verificar RLS Policies na tabela communities
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'communities';

-- 5. Verificar RLS Policies na tabela community_members
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_members';

-- 6. FORÇAR ADIÇÃO À COMUNIDADE PÚBLICA
-- Descomente e execute com o ID correto do aluno
/*
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'COLE_ID_DO_ALUNO_AQUI', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;
*/
