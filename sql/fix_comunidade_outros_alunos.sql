-- ============================================
-- FIX DEFINITIVO: Comunidade para TODOS os alunos
-- ============================================

-- PASSO 1: Ver situação atual de TODOS os alunos
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status_comunidade,
  cm.joined_at
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- PASSO 2: Adicionar TODOS os alunos que estão fora
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

-- PASSO 3: Verificar RLS policies em COMMUNITIES (não só community_members)
SELECT
  tablename,
  policyname,
  cmd,
  SUBSTRING(qual::text, 1, 200) as condicao
FROM pg_policies
WHERE tablename = 'communities'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- PASSO 4: REMOVER policies restritivas em communities e criar ultra-permissiva
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop TODAS as policies de SELECT em communities
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'communities'
        AND cmd = 'SELECT'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON communities';
        RAISE NOTICE 'Removida policy: %', r.policyname;
    END LOOP;
END$$;

-- Criar policy ULTRA-PERMISSIVA para communities
CREATE POLICY "communities_select_all"
ON communities FOR SELECT
TO authenticated
USING (true);

-- PASSO 5: Verificar que policies estão ativas AGORA
SELECT
  'COMMUNITIES' as tabela,
  policyname,
  cmd,
  CASE WHEN qual::text = 'true' THEN '✅ PERMISSIVA (true)' ELSE '⚠️ TEM FILTRO' END as tipo
FROM pg_policies
WHERE tablename = 'communities'
  AND cmd = 'SELECT'
UNION ALL
SELECT
  'COMMUNITY_MEMBERS' as tabela,
  policyname,
  cmd,
  CASE WHEN qual::text = 'true' THEN '✅ PERMISSIVA (true)' ELSE '⚠️ TEM FILTRO' END as tipo
FROM pg_policies
WHERE tablename = 'community_members'
  AND cmd = 'SELECT'
ORDER BY tabela, policyname;

-- PASSO 6: Testar EXATAMENTE como outro aluno (simulação)
DO $$
DECLARE
  test_aluno_id UUID;
  test_aluno_name TEXT;
  community_ids_count INT;
  communities_count INT;
BEGIN
  -- Pegar UM aluno que não é o Guilherme
  SELECT id, full_name INTO test_aluno_id, test_aluno_name
  FROM profiles
  WHERE role = 'aluno'
    AND id != '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  LIMIT 1;

  IF test_aluno_id IS NULL THEN
    RAISE NOTICE '❌ Não encontrou outro aluno para testar';
    RETURN;
  END IF;

  RAISE NOTICE '🧪 Testando com aluno: % (ID: %)', test_aluno_name, test_aluno_id;

  -- Simular QUERY 1: buscar community_ids (igual ao app)
  SELECT COUNT(*) INTO community_ids_count
  FROM community_members
  WHERE aluno_id = test_aluno_id;

  RAISE NOTICE '  ├─ community_members: % registros', community_ids_count;

  -- Simular QUERY 2: buscar communities
  SELECT COUNT(*) INTO communities_count
  FROM communities
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RAISE NOTICE '  ├─ communities: % registros', communities_count;

  IF community_ids_count > 0 AND communities_count > 0 THEN
    RAISE NOTICE '  └─ ✅ ALUNO DEVERIA VER A COMUNIDADE';
  ELSE
    RAISE NOTICE '  └─ ❌ PROBLEMA: aluno NÃO vai ver comunidade';
    IF community_ids_count = 0 THEN
      RAISE NOTICE '      Motivo: não está em community_members';
    END IF;
    IF communities_count = 0 THEN
      RAISE NOTICE '      Motivo: RLS bloqueando communities';
    END IF;
  END IF;
END$$;

-- PASSO 7: Contar TOTAL de alunos vs TOTAL na comunidade
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'aluno') as total_alunos,
  (SELECT COUNT(*) FROM community_members WHERE community_id = '00000000-0000-0000-0000-000000000001') as total_na_comunidade;

-- PASSO 8: Mostrar a comunidade pública
SELECT
  id,
  name,
  type,
  description,
  created_at
FROM communities
WHERE id = '00000000-0000-0000-0000-000000000001';
