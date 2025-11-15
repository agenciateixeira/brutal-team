-- ============================================
-- FIX DEFINITIVO: Acesso à Comunidade
-- ============================================
-- Execute tudo de uma vez

-- 1. Remover policies antigas que podem estar causando problema
DROP POLICY IF EXISTS "Alunos podem ver suas comunidades" ON communities;
DROP POLICY IF EXISTS "Alunos podem ver membros das suas comunidades" ON community_members;

-- 2. Criar policies CORRETAS E PERMISSIVAS

-- Communities: Alunos podem ver onde são membros OU comunidades públicas
CREATE POLICY "Alunos podem ver comunidades"
ON communities FOR SELECT
TO public
USING (
  -- Ver comunidades públicas
  type = 'public'
  OR
  -- Ver comunidades onde é membro
  id IN (
    SELECT community_id FROM community_members
    WHERE aluno_id = auth.uid()
  )
);

-- Community_members: Alunos podem ver membros de suas comunidades
CREATE POLICY "Alunos podem ver membros"
ON community_members FOR SELECT
TO public
USING (
  community_id IN (
    SELECT community_id FROM community_members cm
    WHERE cm.aluno_id = auth.uid()
  )
);

-- 3. Garantir que RLS está ativo
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 4. Testar query da aplicação com um ID real
-- Substitua pelo seu ID se quiser testar
SELECT
  cm.community_id,
  c.id,
  c.name,
  c.description,
  c.type
FROM community_members cm
INNER JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' -- Guilherme
LIMIT 5;

-- 5. Ver todas as policies criadas
SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'Tem restrição' ELSE 'Sem restrição' END as status
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;
