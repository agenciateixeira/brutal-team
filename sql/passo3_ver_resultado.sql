-- Ver daily_stats de HOJE
SELECT
  'DAILY_STATS' as tipo,
  workouts_planned,
  workouts_completed,
  meals_planned,
  meals_completed,
  is_active_day,
  updated_at
FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- Ver user_stats
SELECT
  'USER_STATS' as tipo,
  total_workouts,
  total_meals_completed,
  current_streak,
  longest_streak,
  total_active_days,
  last_active_date,
  updated_at
FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
