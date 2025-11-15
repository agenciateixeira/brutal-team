-- ============================================
-- TESTAR: Como outro aluno vê a comunidade
-- ============================================

-- PASSO 1: Pegar ID de um aluno que NÃO é você
SELECT id, full_name, email
FROM profiles
WHERE role = 'aluno'
  AND id != '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
LIMIT 1;

-- ===== COLE O ID DO ALUNO ACIMA NAS QUERIES ABAIXO =====
-- Substitua 'ID_ALUNO_AQUI' pelo ID que apareceu acima

-- PASSO 2: Ver se esse aluno está na comunidade
SELECT
  cm.*,
  c.name as community_name
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = 'ID_ALUNO_AQUI';

-- PASSO 3: Testar a QUERY EXATA que a aplicação usa (community_members)
SELECT community_id
FROM community_members
WHERE aluno_id = 'ID_ALUNO_AQUI';

-- PASSO 4: Testar a QUERY EXATA que a aplicação usa (communities)
-- (substitua o array pelos IDs que apareceram no PASSO 3)
SELECT id, name, description, type
FROM communities
WHERE id IN ('00000000-0000-0000-0000-000000000001');

-- PASSO 5: Ver RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  SUBSTRING(qual::text, 1, 100) as condicao
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- PASSO 6: ADICIONAR o aluno na comunidade SE NÃO ESTIVER
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'ID_ALUNO_AQUI', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- PASSO 7: Verificar se FOI ADICIONADO
SELECT 'DEPOIS DE ADICIONAR' as momento, *
FROM community_members
WHERE aluno_id = 'ID_ALUNO_AQUI';
