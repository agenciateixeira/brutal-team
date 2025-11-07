-- ============================================
-- DEBUG: Erro 400 ao postar
-- ============================================

-- 1. Verificar schema da tabela community_posts
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_posts'
ORDER BY ordinal_position;

-- 2. Verificar policies atuais
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_posts';

-- 3. Testar se a função get_community_network existe e funciona
-- (substitua 'SEU_USER_ID' pelo ID real do usuário para testar)
SELECT * FROM get_community_network(auth.uid()) LIMIT 5;

-- 4. Verificar se há constraints que podem estar falhando
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'community_posts';

-- 5. Tentar inserção manual para ver erro específico
-- IMPORTANTE: Execute este INSERT com o usuário logado no app
-- Substitua os valores pelos valores reais
/*
INSERT INTO community_posts (aluno_id, photo_url, caption, workout_type)
VALUES (
  auth.uid(), -- ou coloque seu UUID manualmente
  'https://exemplo.com/foto.jpg',
  'Teste de post',
  'treino'
);
*/

-- 6. Ver últimos logs de erro (se houver extensão pgaudit ou similar)
-- SELECT * FROM postgres_log ORDER BY log_time DESC LIMIT 10;

-- ============================================
-- POSSÍVEIS SOLUÇÕES
-- ============================================

-- Se o problema for a policy de INSERT, recrie assim:
/*
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;

CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);
*/

-- Se o problema for campo obrigatório, verifique:
-- - created_at tem default? (deve ser NOW() ou similar)
-- - id é SERIAL ou UUID com default gen_random_uuid()?
-- - Há algum campo NOT NULL sem default?
