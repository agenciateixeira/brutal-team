-- ============================================
-- FIX: Recursão Infinita em community_members
-- ============================================

-- 1. REMOVER TODAS AS POLICIES DE community_members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'community_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON community_members';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END$$;

-- 2. CRIAR POLICIES ULTRA-SIMPLES (SEM RECURSÃO)

-- SELECT: Qualquer usuário autenticado pode ver membros
CREATE POLICY "community_members_select"
ON community_members FOR SELECT
TO authenticated
USING (true);

-- INSERT: Qualquer usuário autenticado pode adicionar membros
CREATE POLICY "community_members_insert"
ON community_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Qualquer usuário autenticado pode atualizar
CREATE POLICY "community_members_update"
ON community_members FOR UPDATE
TO authenticated
USING (true);

-- DELETE: Qualquer usuário autenticado pode deletar
CREATE POLICY "community_members_delete"
ON community_members FOR DELETE
TO authenticated
USING (true);

-- 3. FAZER O MESMO PARA communities

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'communities') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON communities';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END$$;

-- Policies ultra-simples para communities
CREATE POLICY "communities_select"
ON communities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "communities_insert"
ON communities FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "communities_update"
ON communities FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "communities_delete"
ON communities FOR DELETE
TO authenticated
USING (true);

-- 4. VERIFICAR POLICIES FINAIS
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, cmd, policyname;

-- Deve mostrar apenas 4 policies para cada tabela (SELECT, INSERT, UPDATE, DELETE)
