-- ============================================
-- TESTAR: Comunidade para outros alunos
-- ============================================

-- Pegar ID de um aluno que NÃO é você
SELECT id, full_name, email
FROM profiles
WHERE role = 'aluno'
  AND id != '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
LIMIT 3;

-- ===== COLE UM DOS IDs ACIMA E USE NAS QUERIES ABAIXO =====

-- Query 1: Mesma query que a aplicação faz (community_members)
SELECT community_id
FROM community_members
WHERE aluno_id = 'COLE_ID_AQUI';

-- Query 2: Ver se o aluno está na tabela community_members
SELECT *
FROM community_members
WHERE aluno_id = 'COLE_ID_AQUI';

-- Query 3: Ver TODOS os membros da comunidade pública
SELECT cm.*, p.full_name
FROM community_members cm
JOIN profiles p ON cm.aluno_id = p.id
WHERE cm.community_id = '00000000-0000-0000-0000-000000000001'
ORDER BY p.full_name;

-- Query 4: Adicionar manualmente um aluno que está fora
-- Se a query 2 retornar vazio, execute isto:
/*
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'COLE_ID_AQUI', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;
*/

-- Query 5: Verificar RLS (ver se policies estão bloqueando)
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "COLE_ID_AQUI"}';

-- Tentar query como se fosse o aluno
SELECT community_id
FROM community_members
WHERE aluno_id = 'COLE_ID_AQUI';

-- Resetar
RESET ROLE;
