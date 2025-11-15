-- ============================================
-- CRIAR DADOS DE TESTE E VERIFICAR
-- ============================================

-- PASSO 1: Ver constraints (para saber como fazer INSERT)
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('workout_tracking', 'meal_tracking')
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, kcu.ordinal_position;

-- PASSO 2: Ver estrutura completa de workout_tracking
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
ORDER BY ordinal_position;

-- PASSO 3: Ver se TEM dados de HOJE
SELECT
  'HOJE em workout_tracking' as tipo,
  COUNT(*) as total
FROM workout_tracking
WHERE date = CURRENT_DATE;

SELECT
  'HOJE em meal_tracking' as tipo,
  COUNT(*) as total
FROM meal_tracking
WHERE date = CURRENT_DATE;

-- PASSO 4: Ver TODOS os dados de workout_tracking
SELECT * FROM workout_tracking
ORDER BY date DESC
LIMIT 10;

-- PASSO 5: Ver TODOS os dados de meal_tracking
SELECT * FROM meal_tracking
ORDER BY date DESC
LIMIT 10;

-- PASSO 6: CRIAR dados de teste para HOJE
-- Primeiro verificar se já existe
DO $$
DECLARE
  test_id UUID := '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
  exists_workout BOOLEAN;
  exists_meal BOOLEAN;
BEGIN
  -- Verificar se já existe workout de hoje
  SELECT EXISTS(
    SELECT 1 FROM workout_tracking
    WHERE aluno_id = test_id AND date = CURRENT_DATE
  ) INTO exists_workout;

  -- Verificar se já existe meal de hoje
  SELECT EXISTS(
    SELECT 1 FROM meal_tracking
    WHERE aluno_id = test_id AND date = CURRENT_DATE
  ) INTO exists_meal;

  -- Se NÃO existe, criar
  IF NOT exists_workout THEN
    INSERT INTO workout_tracking (aluno_id, date, completed)
    VALUES (test_id, CURRENT_DATE, true);
    RAISE NOTICE '✅ Treino de teste criado';
  ELSE
    UPDATE workout_tracking
    SET completed = true, updated_at = NOW()
    WHERE aluno_id = test_id AND date = CURRENT_DATE;
    RAISE NOTICE '✅ Treino de teste atualizado';
  END IF;

  IF NOT exists_meal THEN
    INSERT INTO meal_tracking (aluno_id, date, cafe_da_manha, almoco, janta)
    VALUES (test_id, CURRENT_DATE, true, true, true);
    RAISE NOTICE '✅ Refeição de teste criada';
  ELSE
    UPDATE meal_tracking
    SET cafe_da_manha = true, almoco = true, janta = true, updated_at = NOW()
    WHERE aluno_id = test_id AND date = CURRENT_DATE;
    RAISE NOTICE '✅ Refeição de teste atualizada';
  END IF;
END $$;

-- PASSO 7: Ver se daily_stats foi atualizado
SELECT
  'DAILY_STATS' as tipo,
  workouts_completed,
  meals_completed,
  is_active_day,
  updated_at
FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- PASSO 8: Ver user_stats
SELECT
  'USER_STATS' as tipo,
  total_workouts,
  total_meals_completed,
  current_streak,
  longest_streak,
  updated_at
FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- PASSO 9: Ver se os triggers estão ATIVOS
SELECT
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('workout_tracking', 'meal_tracking')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
