-- ============================================
-- FIX CORRIGIDO (sem erros de sintaxe)
-- ============================================

-- PASSO 1: Adicionar todos à comunidade
DO $$
BEGIN
  INSERT INTO community_members (community_id, aluno_id, role)
  SELECT
    '00000000-0000-0000-0000-000000000001',
    id,
    'member'
  FROM profiles
  WHERE role = 'aluno'
  ON CONFLICT (community_id, aluno_id) DO NOTHING;

  RAISE NOTICE '✅ Todos alunos adicionados à comunidade';
END $$;

-- PASSO 2: Recriar função de workout_tracking
CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  total_workouts INT;
  completed_workouts INT;
BEGIN
  track_date := COALESCE(NEW.date, OLD.date);

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts, completed_workouts
  FROM workout_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = track_date;

  INSERT INTO daily_stats (
    aluno_id,
    date,
    workouts_planned,
    workouts_completed,
    is_active_day,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    track_date,
    total_workouts,
    completed_workouts,
    completed_workouts > 0,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = EXCLUDED.workouts_planned,
    workouts_completed = EXCLUDED.workouts_completed,
    is_active_day = EXCLUDED.is_active_day,
    updated_at = NOW();

  UPDATE user_stats
  SET
    total_workouts = (
      SELECT COUNT(*) FROM workout_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id) AND completed = true
    ),
    current_month_workout_percentage = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*) * 100)
      END
      FROM workout_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
        AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ),
    current_streak = CASE
      WHEN completed_workouts > 0 AND last_active_date = track_date - INTERVAL '1 day'
        THEN current_streak + 1
      WHEN completed_workouts > 0
        THEN 1
      ELSE current_streak
    END,
    longest_streak = CASE
      WHEN completed_workouts > 0 AND last_active_date = track_date - INTERVAL '1 day' AND current_streak + 1 > longest_streak
        THEN current_streak + 1
      WHEN completed_workouts > 0 AND 1 > longest_streak
        THEN 1
      ELSE longest_streak
    END,
    last_active_date = CASE
      WHEN completed_workouts > 0 THEN track_date
      ELSE last_active_date
    END,
    total_active_days = CASE
      WHEN completed_workouts > 0 AND (last_active_date IS NULL OR last_active_date < track_date)
        THEN total_active_days + 1
      ELSE total_active_days
    END,
    updated_at = NOW()
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Recriar função de meal_tracking
CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  meals_count INT;
BEGIN
  track_date := COALESCE(NEW.date, OLD.date);

  SELECT
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END +
     CASE WHEN lanche_manha THEN 1 ELSE 0 END +
     CASE WHEN almoco THEN 1 ELSE 0 END +
     CASE WHEN lanche_tarde THEN 1 ELSE 0 END +
     CASE WHEN janta THEN 1 ELSE 0 END +
     CASE WHEN ceia THEN 1 ELSE 0 END)
  INTO meals_count
  FROM meal_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = track_date;

  INSERT INTO daily_stats (
    aluno_id,
    date,
    meals_planned,
    meals_completed,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    track_date,
    6,
    COALESCE(meals_count, 0),
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    meals_planned = 6,
    meals_completed = COALESCE(meals_count, 0),
    updated_at = NOW();

  UPDATE user_stats
  SET
    total_meals_completed = (
      SELECT SUM(
        (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END +
         CASE WHEN lanche_manha THEN 1 ELSE 0 END +
         CASE WHEN almoco THEN 1 ELSE 0 END +
         CASE WHEN lanche_tarde THEN 1 ELSE 0 END +
         CASE WHEN janta THEN 1 ELSE 0 END +
         CASE WHEN ceia THEN 1 ELSE 0 END)
      )
      FROM meal_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    ),
    current_month_meal_percentage = (
      SELECT CASE
        WHEN COUNT(*) * 6 = 0 THEN 0
        ELSE (
          SUM(
            (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END +
             CASE WHEN lanche_manha THEN 1 ELSE 0 END +
             CASE WHEN almoco THEN 1 ELSE 0 END +
             CASE WHEN lanche_tarde THEN 1 ELSE 0 END +
             CASE WHEN janta THEN 1 ELSE 0 END +
             CASE WHEN ceia THEN 1 ELSE 0 END)
          )::DECIMAL / (COUNT(*) * 6) * 100
        )
      END
      FROM meal_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
        AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ),
    updated_at = NOW()
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Recriar triggers
DROP TRIGGER IF EXISTS trigger_sync_workout_tracking ON workout_tracking;
DROP TRIGGER IF EXISTS trigger_sync_meal_tracking ON meal_tracking;

CREATE TRIGGER trigger_sync_workout_tracking
  AFTER INSERT OR UPDATE OR DELETE ON workout_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_workout_tracking_to_daily_stats();

CREATE TRIGGER trigger_sync_meal_tracking
  AFTER INSERT OR UPDATE OR DELETE ON meal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_meal_tracking_to_daily_stats();

-- PASSO 5: Ver constraints de workout_tracking e meal_tracking
SELECT
  'workout_tracking' as tabela,
  conname as constraint_name,
  contype as tipo
FROM pg_constraint
WHERE conrelid = 'workout_tracking'::regclass;

SELECT
  'meal_tracking' as tabela,
  conname as constraint_name,
  contype as tipo
FROM pg_constraint
WHERE conrelid = 'meal_tracking'::regclass;

-- PASSO 6: Forçar update nos registros de hoje
UPDATE workout_tracking
SET updated_at = NOW()
WHERE date = CURRENT_DATE;

UPDATE meal_tracking
SET updated_at = NOW()
WHERE date = CURRENT_DATE;

-- PASSO 7: Ver resultado
SELECT
  p.full_name,
  ds.workouts_completed,
  ds.meals_completed,
  ds.is_active_day,
  us.total_workouts,
  us.total_meals_completed,
  us.current_streak
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
JOIN user_stats us ON ds.aluno_id = us.aluno_id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;
