-- ============================================
-- CORRIGIR: Erro 400 ao criar posts
-- ============================================
-- Este SQL simplifica as policies para permitir postagem

-- 1. Dropar todas as policies existentes
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;

-- 2. Recriar policy de INSERT mais simples (SEM verificações complexas)
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
);

-- 3. Recriar policy de SELECT (ver posts da rede)
CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  -- Pode ver seus próprios posts
  auth.uid() = aluno_id
  OR
  -- OU pode ver posts de pessoas na sua rede
  EXISTS (
    SELECT 1
    FROM get_community_network(auth.uid()) net
    WHERE net.member_id = community_posts.aluno_id
  )
);

-- 4. Policy de DELETE
CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = aluno_id);

-- 5. Policy para coaches verem tudo
CREATE POLICY "Coaches podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- 6. Garantir que RLS está ativado
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 7. Verificar se a tabela está correta
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Verificar se colunas essenciais existem
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'community_posts'
  AND column_name IN ('id', 'aluno_id', 'photo_url', 'caption', 'workout_type', 'created_at');

  IF col_count < 6 THEN
    RAISE EXCEPTION 'Tabela community_posts está faltando colunas!';
  END IF;

  RAISE NOTICE '✅ Correção aplicada!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies recriadas:';
  RAISE NOTICE '  ✓ INSERT: apenas verifica se aluno_id = auth.uid()';
  RAISE NOTICE '  ✓ SELECT: pode ver próprios posts + posts da rede';
  RAISE NOTICE '  ✓ DELETE: pode deletar próprios posts';
  RAISE NOTICE '  ✓ COACHES: podem ver tudo';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Tente postar novamente!';
END $$;
