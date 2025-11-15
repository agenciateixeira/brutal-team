-- ============================================
-- VERIFICAR E CRIAR DADOS DE TESTE
-- ============================================

-- 1. Ver se TEM dados em workout_tracking
SELECT
  'WORKOUT_TRACKING' as tabela,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE date = CURRENT_DATE) as registros_hoje
FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 2. Ver se TEM dados em meal_tracking
SELECT
  'MEAL_TRACKING' as tabela,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE date = CURRENT_DATE) as registros_hoje
FROM meal_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 3. Ver TODOS os registros de workout_tracking (últimos 10)
SELECT * FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
ORDER BY date DESC
LIMIT 10;

-- 4. Ver TODOS os registros de meal_tracking (últimos 10)
SELECT * FROM meal_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
ORDER BY date DESC
LIMIT 10;

-- 5. CRIAR dados de teste SE NÃO EXISTIR
-- Treino de teste
INSERT INTO workout_tracking (aluno_id, date, completed)
VALUES ('501a3efe-84a6-4c71-b135-4c59b41a4e0e', CURRENT_DATE, true)
ON CONFLICT (aluno_id, date)
DO UPDATE SET
  completed = true,
  updated_at = NOW();

-- Refeição de teste
INSERT INTO meal_tracking (aluno_id, date, cafe_da_manha, almoco, janta)
VALUES ('501a3efe-84a6-4c71-b135-4c59b41a4e0e', CURRENT_DATE, true, true, true)
ON CONFLICT (aluno_id, date)
DO UPDATE SET
  cafe_da_manha = true,
  almoco = true,
  janta = true,
  updated_at = NOW();

-- 6. Verificar se daily_stats foi atualizado DEPOIS da inserção
SELECT
  'DAILY_STATS DEPOIS' as momento,
  workouts_completed,
  meals_completed,
  is_active_day,
  updated_at
FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- 7. Verificar user_stats
SELECT
  'USER_STATS' as tipo,
  total_workouts,
  total_meals_completed,
  current_streak,
  longest_streak,
  updated_at
FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 8. Ver se os triggers EXISTEM
SELECT
  event_object_table,
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('workout_tracking', 'meal_tracking')
  AND trigger_schema = 'public'
ORDER BY event_object_table;
