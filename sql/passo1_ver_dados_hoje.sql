-- Ver se TEM dados de HOJE
SELECT
  'workout_tracking' as tabela,
  COUNT(*) as registros_hoje
FROM workout_tracking
WHERE date = CURRENT_DATE;

SELECT
  'meal_tracking' as tabela,
  COUNT(*) as registros_hoje
FROM meal_tracking
WHERE date = CURRENT_DATE;

-- Ver os registros de hoje do seu usuário
SELECT 'SEU WORKOUT HOJE' as tipo, *
FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

SELECT 'SEU MEAL HOJE' as tipo, *
FROM meal_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;
