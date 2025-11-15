-- ============================================
-- GARANTIR: Todos alunos na comunidade pública
-- ============================================

-- 1. Ver quem está FORA da comunidade pública
SELECT
  p.id,
  p.full_name,
  p.email,
  'FORA DA COMUNIDADE' as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL
ORDER BY p.full_name;

-- 2. ADICIONAR todos os alunos que estão fora
INSERT INTO community_members (community_id, aluno_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  p.id,
  'member'
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL
ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- 3. Verificar se TODOS estão na comunidade agora
SELECT
  p.id,
  p.full_name,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 4. Contar total
SELECT
  COUNT(*) as total_membros_na_comunidade
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';
