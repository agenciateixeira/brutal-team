-- ============================================
-- DEBUG: Por que daily_stats não atualiza?
-- ============================================

-- 1. Ver se o trigger existe e está ativo
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('meal_tracking', 'workout_tracking')
ORDER BY event_object_table, trigger_name;

-- 2. Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.date,
  ds.workouts_planned,
  ds.workouts_completed,
  ds.meals_planned,
  ds.meals_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- 3. Ver user_stats
SELECT
  p.full_name,
  us.total_workouts,
  us.total_meals_completed,
  us.current_streak,
  us.longest_streak,
  us.total_active_days,
  us.updated_at
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 4. Ver registros de workout_tracking de hoje
SELECT * FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- 5. Ver registros de meal_tracking de hoje
SELECT * FROM meal_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- 6. Forçar atualização manual do trigger
-- Simular um UPDATE para disparar o trigger
UPDATE meal_tracking
SET updated_at = NOW()
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

UPDATE workout_tracking
SET updated_at = NOW()
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- 7. Verificar daily_stats DEPOIS da atualização forçada
SELECT
  p.full_name,
  ds.date,
  ds.workouts_planned,
  ds.workouts_completed,
  ds.meals_planned,
  ds.meals_completed,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
  AND p.id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
