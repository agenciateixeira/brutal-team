-- ============================================
-- DIAGNÓSTICO: Ver estrutura e dados
-- ============================================

-- 1. Ver colunas da tabela workout_tracking
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
ORDER BY ordinal_position;

-- 2. Ver quantos registros existem
SELECT
  'workout_tracking' as tabela,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE completed = true) as completados
FROM workout_tracking;

-- 3. Ver alguns exemplos de workout_tracking
SELECT *
FROM workout_tracking
ORDER BY created_at DESC
LIMIT 5;

-- 4. Ver user_stats atual
SELECT
  p.full_name,
  us.*
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
LIMIT 3;

-- 5. Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.*
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY ds.updated_at DESC;
