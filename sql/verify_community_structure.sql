-- ============================================
-- VERIFICAR ESTRUTURA DAS TABELAS DE COMUNIDADE
-- ============================================

-- 1. Verificar se a tabela communities existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'communities'
) as communities_exists;

-- 2. Verificar se a tabela community_members existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'community_members'
) as community_members_exists;

-- 3. Verificar foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('community_members', 'communities');

-- 4. Verificar se a comunidade pública existe
SELECT * FROM communities
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Contar registros
SELECT
  (SELECT COUNT(*) FROM communities) as total_communities,
  (SELECT COUNT(*) FROM community_members) as total_members,
  (SELECT COUNT(*) FROM profiles WHERE role = 'aluno') as total_alunos;

-- 6. Query EXATA que a aplicação usa (teste direto)
-- Execute este com seu user_id para simular o que a app faz
-- Substitua 'SEU_USER_ID' pelo ID do usuário com problema

SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = 'SEU_USER_ID'; -- <-- TROQUE AQUI

-- 7. Se a query acima retornar vazio, adicione o usuário manualmente:
/*
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'SEU_USER_ID', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;
*/
