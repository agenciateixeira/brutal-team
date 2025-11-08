-- ============================================
-- TESTAR RLS COMO USUÁRIO ESPECÍFICO
-- ============================================
-- Este SQL testa se a query funciona do ponto de vista do usuário

-- 1. TESTAR QUERY EXATA DA APLICAÇÃO (substitua USER_ID_AQUI)
-- Cole um dos IDs dos alunos acima
DO $$
DECLARE
  test_user_id UUID := '501a3efe-84a6-4c71-b135-4c59b41a4e0e'; -- Guilherme Teixeira
BEGIN
  -- Simular auth.uid()
  PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, TRUE);

  -- Executar query
  RAISE NOTICE 'Testando com usuário: %', test_user_id;
END $$;

-- 2. Query que a aplicação usa
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'; -- Guilherme

-- 3. Se a query acima retornar VAZIO, o problema é RLS
-- Execute este para DESABILITAR temporariamente RLS e testar:
/*
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- Testar novamente a query acima
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- REABILITAR RLS (IMPORTANTE!)
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
*/

-- 4. SOLUÇÃO DEFINITIVA: Recriar policies mais permissivas
-- Execute se a query acima funcionar sem RLS mas não funciona com RLS

DROP POLICY IF EXISTS "Alunos podem ver suas comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver membros das suas comunidades" ON community_members;

-- Policy MUITO permissiva para communities (qualquer aluno autenticado)
CREATE POLICY "Alunos podem ver todas as comunidades onde são membros"
ON communities FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = communities.id
    AND cm.aluno_id = auth.uid()
  )
  OR type = 'public' -- Permitir ver comunidades públicas
);

-- Policy MUITO permissiva para community_members
CREATE POLICY "Alunos podem ver membros de comunidades onde participam"
ON community_members FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM community_members cm2
    WHERE cm2.community_id = community_members.community_id
    AND cm2.aluno_id = auth.uid()
  )
);

-- 5. Verificar se as policies foram criadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;
