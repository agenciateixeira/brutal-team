-- ============================================
-- FIX: Circular RLS Dependency
-- ============================================
-- O problema: A policy de community_members estava causando uma
-- dependência circular ao verificar se o usuário é membro consultando
-- a própria tabela community_members novamente.

-- 1. Remover a policy problemática
DROP POLICY IF EXISTS "select_members_policy" ON community_members;

-- 2. Criar policy SEM circular dependency
-- Permitir que usuários autenticados vejam:
-- a) Seus próprios registros de membership
-- b) Membros de comunidades públicas
CREATE POLICY "select_members_policy"
ON community_members FOR SELECT
USING (
  -- Pode ver seus próprios registros de membership
  aluno_id = auth.uid()
  OR
  -- Pode ver membros de comunidades públicas
  community_id IN (
    SELECT id FROM communities WHERE type = 'public'
  )
);

-- 3. Verificar as policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, cmd, policyname;
