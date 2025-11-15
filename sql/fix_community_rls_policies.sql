-- ============================================
-- CORRIGIR RLS POLICIES DE COMUNIDADES
-- ============================================
-- Este SQL corrige policies que podem estar bloqueando acesso

-- 1. Remover policies antigas que podem estar conflitando
DROP POLICY IF EXISTS "Alunos podem ver suas comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver membros das suas comunidades" ON community_members;

-- 2. Recriar policy de communities (mais permissiva para alunos)
CREATE POLICY "Alunos podem ver suas comunidades"
ON communities FOR SELECT
USING (
  auth.uid() IN (
    SELECT aluno_id FROM community_members
    WHERE community_members.community_id = communities.id
  )
);

-- 3. Recriar policy de community_members (garantir que aluno vê seus membros)
CREATE POLICY "Alunos podem ver membros das suas comunidades"
ON community_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT cm.aluno_id FROM community_members cm
    WHERE cm.community_id = community_members.community_id
  )
);

-- 4. Garantir que RLS está habilitado
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as policies foram criadas corretamente
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;

-- 6. Testar query que a aplicação usa (substitua pelo ID do seu usuário)
-- Descomente para testar:
/*
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = 'COLE_SEU_USER_ID_AQUI';
*/
