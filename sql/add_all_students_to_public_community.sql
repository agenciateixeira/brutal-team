-- ============================================
-- ADICIONAR TODOS OS ALUNOS À COMUNIDADE PÚBLICA
-- ============================================
-- Execute este SQL para garantir que TODOS os alunos
-- (aprovados ou não) sejam adicionados à comunidade pública

-- Ver quantos alunos existem
SELECT COUNT(*) as total_alunos
FROM profiles
WHERE role = 'aluno';

-- Ver quantos alunos JÁ estão na comunidade pública
SELECT COUNT(*) as alunos_na_comunidade
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- ADICIONAR TODOS OS ALUNOS à comunidade pública (incluindo não aprovados)
INSERT INTO community_members (community_id, aluno_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'member'
FROM profiles
WHERE role = 'aluno'
ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- Verificar resultado
SELECT COUNT(*) as alunos_adicionados
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- Ver detalhes dos alunos na comunidade
SELECT
  p.id,
  p.email,
  p.full_name,
  p.approved,
  cm.joined_at
FROM community_members cm
JOIN profiles p ON cm.aluno_id = p.id
WHERE cm.community_id = '00000000-0000-0000-0000-000000000001'
ORDER BY cm.joined_at DESC;
