-- ============================================
-- TESTAR: Por que comunidade não aparece
-- ============================================

-- PASSO 1: Verificar policies ATUAIS em communities
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
WHERE tablename = 'communities'
ORDER BY policyname;

-- PASSO 2: Testar query EXATAMENTE como o app faz
DO $$
DECLARE
  test_aluno_id UUID;
  test_aluno_email TEXT;
  community_ids UUID[];
  found_communities RECORD;
BEGIN
  -- Pegar o aluno teste
  SELECT id, email INTO test_aluno_id, test_aluno_email
  FROM profiles
  WHERE email = 'teste1@teste.com';

  RAISE NOTICE '============================================';
  RAISE NOTICE '🧪 SIMULANDO QUERY DO APP';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Aluno: % (%)', test_aluno_email, test_aluno_id;
  RAISE NOTICE '';

  -- QUERY 1: Buscar community_ids (linha 38-41 do código)
  SELECT ARRAY_AGG(community_id) INTO community_ids
  FROM community_members
  WHERE aluno_id = test_aluno_id;

  RAISE NOTICE '📋 PASSO 1 - Buscar community_members:';
  RAISE NOTICE '   IDs encontrados: %', community_ids;
  RAISE NOTICE '';

  -- QUERY 2: Buscar communities (linha 46-49 do código)
  RAISE NOTICE '📋 PASSO 2 - Buscar communities com esses IDs:';

  FOR found_communities IN
    SELECT id, name, type
    FROM communities
    WHERE id = ANY(COALESCE(community_ids, ARRAY['00000000-0000-0000-0000-000000000001']::UUID[]))
  LOOP
    RAISE NOTICE '   ✅ Comunidade: % (tipo: %)', found_communities.name, found_communities.type;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '   ❌ NENHUMA COMUNIDADE ENCONTRADA!';
    RAISE NOTICE '   ⚠️  Possível problema: RLS bloqueando a query';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END$$;

-- PASSO 3: Verificar se policy está correta
SELECT
  'communities_select_all' as policy_esperada,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'communities'
        AND policyname = 'communities_select_all'
        AND qual = 'true'
    ) THEN '✅ POLICY CORRETA (true)'
    ELSE '❌ POLICY INCORRETA OU NÃO EXISTE'
  END as status;

-- PASSO 4: Se policy não existir ou estiver errada, corrigir
DO $$
BEGIN
  -- Drop todas as policies de SELECT
  EXECUTE 'DROP POLICY IF EXISTS "communities_select_all" ON communities';
  EXECUTE 'DROP POLICY IF EXISTS "communities_select" ON communities';
  EXECUTE 'DROP POLICY IF EXISTS "allow_authenticated_select_communities" ON communities';

  -- Criar policy ultra-permissiva
  EXECUTE 'CREATE POLICY "communities_select_all" ON communities FOR SELECT TO authenticated USING (true)';

  RAISE NOTICE '✅ Policy recriada: communities_select_all';
END$$;

-- PASSO 5: Testar novamente após correção
DO $$
DECLARE
  test_aluno_id UUID;
  found_count INT;
BEGIN
  SELECT id INTO test_aluno_id
  FROM profiles
  WHERE email = 'teste1@teste.com';

  SELECT COUNT(*) INTO found_count
  FROM communities
  WHERE id = '00000000-0000-0000-0000-000000000001';

  RAISE NOTICE '';
  RAISE NOTICE '🔄 TESTE PÓS-CORREÇÃO:';
  RAISE NOTICE '   Comunidade pública encontrada: %', CASE WHEN found_count > 0 THEN 'SIM ✅' ELSE 'NÃO ❌' END;
  RAISE NOTICE '';
END$$;
