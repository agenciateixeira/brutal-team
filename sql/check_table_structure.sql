-- ============================================
-- VERIFICAR: Estrutura das tabelas
-- ============================================

-- 1. Colunas de meal_tracking
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'meal_tracking'
ORDER BY ordinal_position;

-- 2. Colunas de workout_tracking
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
ORDER BY ordinal_position;

-- 3. Colunas de community_posts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'community_posts'
ORDER BY ordinal_position;

-- 4. Exemplo de dados de meal_tracking
SELECT * FROM meal_tracking LIMIT 3;

-- 5. Exemplo de dados de workout_tracking
SELECT * FROM workout_tracking LIMIT 3;

-- 6. Exemplo de dados de community_posts
SELECT * FROM community_posts LIMIT 3;
