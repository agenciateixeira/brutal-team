-- ========================================
-- VERIFICAR TABELAS DA COMUNIDADE
-- ========================================

-- 1. Listar todas as tabelas relacionadas a posts, likes e comentários
SELECT
  table_name,
  CASE
    WHEN table_name LIKE '%post%' AND table_name LIKE '%like%' THEN 'LIKE'
    WHEN table_name LIKE '%post%' AND table_name LIKE '%comment%' THEN 'COMMENT'
    WHEN table_name LIKE '%like%' THEN 'LIKE'
    WHEN table_name LIKE '%comment%' THEN 'COMMENT'
    WHEN table_name LIKE '%post%' THEN 'POST'
    ELSE 'OTHER'
  END as type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%post%'
    OR table_name LIKE '%like%'
    OR table_name LIKE '%comment%'
  )
ORDER BY type, table_name;

-- 2. Verificar estrutura da tabela community_posts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'community_posts'
ORDER BY ordinal_position;

-- 3. Procurar tabelas que possam ser de curtidas
SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND column_name = 'post_id') as has_post_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND column_name = 'user_id') as has_user_id
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%like%'
ORDER BY table_name;

-- 4. Procurar tabelas que possam ser de comentários
SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND column_name = 'post_id') as has_post_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND column_name = 'content') as has_content,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND column_name = 'user_id') as has_user_id
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%comment%'
ORDER BY table_name;
