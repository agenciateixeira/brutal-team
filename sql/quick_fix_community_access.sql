-- ============================================
-- FIX RÁPIDO: Permitir alunos verem suas comunidades
-- ============================================

-- 1. Verificar policies atuais de communities
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'communities';

-- 2. Se não aparecer a policy "Alunos podem ver suas comunidades", execute:

-- Garantir que a policy existe e está correta
DROP POLICY IF EXISTS "Alunos podem ver suas comunidades" ON communities;

CREATE POLICY "Alunos podem ver suas comunidades"
ON communities FOR SELECT
TO public
USING (
  id IN (
    SELECT community_id FROM community_members
    WHERE aluno_id = auth.uid()
  )
);

-- 3. Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'communities';

-- Se rowsecurity = false, execute:
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- 4. Testar se funciona (substitua pelo SEU user_id)
-- Descomente e execute:
/*
SELECT
  c.id,
  c.name,
  c.type
FROM communities c
WHERE c.id IN (
  SELECT cm.community_id
  FROM community_members cm
  WHERE cm.aluno_id = 'SEU_USER_ID_AQUI'
);
*/

-- 5. Se ainda não funcionar, adicione o usuário manualmente:
/*
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'SEU_USER_ID_AQUI', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;
*/
