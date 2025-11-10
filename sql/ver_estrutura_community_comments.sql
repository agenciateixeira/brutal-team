-- Ver estrutura completa da tabela community_comments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'community_comments'
ORDER BY ordinal_position;

-- Ver estrutura da tabela de likes também
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%like%'
    OR table_name LIKE '%reaction%'
    OR table_name LIKE '%favorite%'
  )
ORDER BY table_name;
