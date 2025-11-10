-- ============================================
-- GARANTIR: TODOS os alunos na comunidade
-- ============================================

-- PASSO 1: Ver quem está FORA
SELECT
  p.id,
  p.full_name,
  p.email,
  '❌ FORA DA COMUNIDADE' as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL;

-- PASSO 2: ADICIONAR TODOS os que estão fora
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

-- PASSO 3: Verificar que TODOS estão dentro AGORA
SELECT
  p.id,
  p.full_name,
  p.email,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status,
  cm.joined_at
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- PASSO 4: Testar query da aplicação para UM aluno específico
-- (pegar o primeiro aluno que não é você)
DO $$
DECLARE
  test_aluno_id UUID;
  community_count INT;
BEGIN
  -- Pegar ID de outro aluno
  SELECT id INTO test_aluno_id
  FROM profiles
  WHERE role = 'aluno'
    AND id != '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  LIMIT 1;

  -- Testar query 1: buscar community_ids
  SELECT COUNT(*) INTO community_count
  FROM community_members
  WHERE aluno_id = test_aluno_id;

  RAISE NOTICE 'Aluno % tem % comunidades', test_aluno_id, community_count;

  -- Testar query 2: buscar communities
  PERFORM *
  FROM communities
  WHERE id IN (
    SELECT community_id FROM community_members WHERE aluno_id = test_aluno_id
  );

  IF FOUND THEN
    RAISE NOTICE '✅ Aluno consegue buscar communities';
  ELSE
    RAISE NOTICE '❌ Aluno NÃO consegue buscar communities';
  END IF;
END $$;

-- PASSO 5: Contar total de membros
SELECT
  COUNT(*) as total_membros_na_comunidade_publica
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- PASSO 6: Ver se tem policies bloqueando
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE WHEN qual IS NOT NULL THEN 'TEM FILTRO' ELSE 'SEM FILTRO (true)' END as tipo
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
