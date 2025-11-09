-- ============================================
-- LIMPAR E RECRIAR POLICIES CORRETAMENTE
-- ============================================

-- 1. REMOVER TODAS AS POLICIES DUPLICADAS DE SELECT
DROP POLICY IF EXISTS "Alunos podem ver suas comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver todas as comunidades onde são membros" ON communities;

DROP POLICY IF EXISTS "Alunos podem ver membros das suas comunidades" ON community_members;
DROP POLICY IF EXISTS "Alunos podem ver membros" ON community_members;
DROP POLICY IF EXISTS "Alunos podem ver membros de comunidades onde participam" ON community_members;

-- 2. CRIAR APENAS UMA POLICY DE SELECT PARA COMMUNITIES (simples e permissiva)
CREATE POLICY "select_communities_policy"
ON communities FOR SELECT
USING (
  -- Qualquer aluno pode ver comunidades públicas
  type = 'public'
  OR
  -- Ou comunidades onde é membro
  id IN (
    SELECT community_id FROM community_members WHERE aluno_id = auth.uid()
  )
);

-- 3. CRIAR APENAS UMA POLICY DE SELECT PARA COMMUNITY_MEMBERS (simples e permissiva)
CREATE POLICY "select_members_policy"
ON community_members FOR SELECT
USING (
  -- Pode ver membros de comunidades onde participa
  community_id IN (
    SELECT community_id FROM community_members WHERE aluno_id = auth.uid()
  )
);

-- 4. Garantir RLS ativo
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 5. Verificar resultado (deve ter apenas 1 SELECT policy de cada)
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, cmd, policyname;

-- 6. Testar query da aplicação
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' -- Seu ID
LIMIT 5;
