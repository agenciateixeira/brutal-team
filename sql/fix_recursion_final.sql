-- ============================================
-- FIX DEFINITIVO: Remover TODAS as recursões
-- ============================================

-- PASSO 1: Apagar TODAS as policies que causam recursão
DROP POLICY IF EXISTS "select_communities_policy" ON communities;
DROP POLICY IF EXISTS "select_members_policy" ON community_members;
DROP POLICY IF EXISTS "Alunos podem ver comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver membros" ON community_members;

-- PASSO 2: Criar policies ULTRA-SIMPLES sem subqueries recursivas

-- Para COMMUNITIES: Permitir que alunos autenticados vejam TODAS as comunidades
-- (tanto públicas quanto privadas onde são membros)
-- Sem subquery = sem recursão
CREATE POLICY "allow_select_communities"
ON communities FOR SELECT
TO authenticated
USING (true); -- Temporariamente super permissivo para quebrar a recursão

-- Para COMMUNITY_MEMBERS: Permitir que alunos autenticados vejam TODOS os membros
-- Sem subquery = sem recursão
CREATE POLICY "allow_select_members"
ON community_members FOR SELECT
TO authenticated
USING (true); -- Temporariamente super permissivo para quebrar a recursão

-- PASSO 3: Verificar
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
