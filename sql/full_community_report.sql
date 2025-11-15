-- ============================================
-- RELATÓRIO COMPLETO: Estado da Comunidade
-- ============================================

-- 1. RESUMO GERAL
SELECT
  'RESUMO' as tipo,
  (SELECT COUNT(*) FROM profiles WHERE role = 'aluno') as total_alunos,
  (SELECT COUNT(*) FROM communities) as total_comunidades,
  (SELECT COUNT(DISTINCT aluno_id) FROM community_members) as alunos_em_comunidades,
  (SELECT COUNT(*) FROM community_members WHERE community_id = '00000000-0000-0000-0000-000000000001') as alunos_na_publica;

-- 2. TODOS OS ALUNOS E STATUS NA COMUNIDADE
SELECT
  p.id,
  p.email,
  p.full_name,
  p.approved,
  p.created_at,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA DA COMUNIDADE' END as status_comunidade,
  cm.joined_at as data_entrada_comunidade
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.created_at DESC;

-- 3. ALUNOS QUE ESTÃO FORA DA COMUNIDADE PÚBLICA
SELECT
  p.id,
  p.email,
  p.full_name,
  p.approved,
  p.created_at
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL
ORDER BY p.created_at DESC;

-- 4. MEMBROS ATUAIS DA COMUNIDADE PÚBLICA
SELECT
  p.id,
  p.email,
  p.full_name,
  cm.joined_at,
  cm.role
FROM community_members cm
JOIN profiles p ON cm.aluno_id = p.id
WHERE cm.community_id = '00000000-0000-0000-0000-000000000001'
ORDER BY cm.joined_at DESC;

-- 5. VERIFICAR SE A COMUNIDADE PÚBLICA EXISTE
SELECT
  id,
  name,
  type,
  created_at
FROM communities
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 6. TODAS AS COMUNIDADES QUE EXISTEM
SELECT
  c.id,
  c.name,
  c.type,
  c.created_at,
  COUNT(cm.aluno_id) as total_membros
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
GROUP BY c.id, c.name, c.type, c.created_at
ORDER BY c.created_at;

-- ============================================
-- COMANDOS DE CORREÇÃO
-- ============================================

-- 7. ADICIONAR TODOS OS ALUNOS QUE ESTÃO FORA DA COMUNIDADE
-- Execute este comando para adicionar TODOS os alunos que faltam:
/*
INSERT INTO community_members (community_id, aluno_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  p.id,
  'member'
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL
ON CONFLICT (community_id, aluno_id) DO NOTHING;
*/

-- 8. VERIFICAR QUANTOS FORAM ADICIONADOS (execute após o comando acima)
/*
SELECT
  'APÓS CORREÇÃO' as momento,
  COUNT(*) as total_membros
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';
*/
