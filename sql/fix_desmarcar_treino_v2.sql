-- ============================================
-- FIX v2: Desmarcar treino (versão simplificada)
-- ============================================

DROP FUNCTION IF EXISTS sync_workout_tracking_to_daily_stats() CASCADE;

CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  total_workouts INT;
  completed_workouts INT;
  current_aluno_id UUID;
  streak_count INT := 0;
  longest INT := 0;
  check_date DATE;
  has_activity BOOLEAN;
BEGIN
  track_date := COALESCE(NEW.date, OLD.date);
  current_aluno_id := COALESCE(NEW.aluno_id, OLD.aluno_id);

  -- Contar workouts
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts, completed_workouts
  FROM workout_tracking
  WHERE aluno_id = current_aluno_id AND date = track_date;

  -- Atualizar daily_stats
  INSERT INTO daily_stats (aluno_id, date, workouts_planned, workouts_completed, is_active_day, updated_at)
  VALUES (current_aluno_id, track_date, total_workouts, completed_workouts, completed_workouts > 0, NOW())
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = EXCLUDED.workouts_planned,
    workouts_completed = EXCLUDED.workouts_completed,
    is_active_day = EXCLUDED.is_active_day,
    updated_at = NOW();

  -- CALCULAR STREAK: contar dias consecutivos de trás pra frente
  check_date := CURRENT_DATE;
  LOOP
    SELECT is_active_day INTO has_activity
    FROM daily_stats
    WHERE aluno_id = current_aluno_id AND date = check_date;

    -- Se não tem registro OU não está ativo, para o loop
    IF has_activity IS NULL OR has_activity = false THEN
      -- Só quebra o streak se não for o próprio dia de hoje
      -- (se hoje não tem atividade mas ontem tinha, streak = 0)
      EXIT;
    END IF;

    -- Tem atividade, incrementa streak
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';

    -- Proteção: não calcular mais de 365 dias
    EXIT WHEN streak_count > 365;
  END LOOP;

  -- Pegar longest_streak atual
  SELECT COALESCE(longest_streak, 0) INTO longest
  FROM user_stats
  WHERE aluno_id = current_aluno_id;

  -- Atualizar user_stats
  INSERT INTO user_stats (
    aluno_id,
    total_workouts,
    current_streak,
    longest_streak,
    total_active_days,
    last_active_date,
    updated_at
  )
  SELECT
    current_aluno_id,
    (SELECT COUNT(*) FROM workout_tracking WHERE aluno_id = current_aluno_id AND completed = true),
    streak_count,
    GREATEST(longest, streak_count),
    (SELECT COUNT(*) FROM daily_stats WHERE aluno_id = current_aluno_id AND is_active_day = true),
    (SELECT MAX(date) FROM daily_stats WHERE aluno_id = current_aluno_id AND is_active_day = true),
    NOW()
  ON CONFLICT (aluno_id)
  DO UPDATE SET
    total_workouts = EXCLUDED.total_workouts,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_active_days = EXCLUDED.total_active_days,
    last_active_date = EXCLUDED.last_active_date,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_sync_workout_tracking ON workout_tracking;
CREATE TRIGGER trigger_sync_workout_tracking
  AFTER INSERT OR UPDATE OR DELETE ON workout_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_workout_tracking_to_daily_stats();

-- TAMBÉM ATUALIZAR a função de meal_tracking (mesmo problema)
DROP FUNCTION IF EXISTS sync_meal_tracking_to_daily_stats() CASCADE;

CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  meals_count INT;
  current_aluno_id UUID;
BEGIN
  track_date := COALESCE(NEW.date, OLD.date);
  current_aluno_id := COALESCE(NEW.aluno_id, OLD.aluno_id);

  -- Contar refeições completadas
  SELECT
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END +
     CASE WHEN lanche_manha THEN 1 ELSE 0 END +
     CASE WHEN almoco THEN 1 ELSE 0 END +
     CASE WHEN lanche_tarde THEN 1 ELSE 0 END +
     CASE WHEN janta THEN 1 ELSE 0 END +
     CASE WHEN ceia THEN 1 ELSE 0 END)
  INTO meals_count
  FROM meal_tracking
  WHERE aluno_id = current_aluno_id AND date = track_date;

  -- Se não existe registro, meals_count = 0
  meals_count := COALESCE(meals_count, 0);

  -- Atualizar daily_stats
  INSERT INTO daily_stats (aluno_id, date, meals_planned, meals_completed, updated_at)
  VALUES (current_aluno_id, track_date, 6, meals_count, NOW())
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    meals_planned = 6,
    meals_completed = EXCLUDED.meals_completed,
    updated_at = NOW();

  -- Atualizar user_stats
  UPDATE user_stats SET
    total_meals_completed = (
      SELECT SUM(meals_completed) FROM daily_stats WHERE aluno_id = current_aluno_id
    ),
    updated_at = NOW()
  WHERE aluno_id = current_aluno_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_sync_meal_tracking ON meal_tracking;
CREATE TRIGGER trigger_sync_meal_tracking
  AFTER INSERT OR UPDATE OR DELETE ON meal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_meal_tracking_to_daily_stats();

-- ============================================
-- TESTE: Marcar e Desmarcar
-- ============================================

-- 1. MARCAR treino
UPDATE workout_tracking
SET completed = true, updated_at = NOW()
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

SELECT 'DEPOIS DE MARCAR' as momento,
  workouts_completed,
  is_active_day
FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' AND date = CURRENT_DATE;

SELECT 'DEPOIS DE MARCAR' as momento,
  total_workouts,
  current_streak,
  longest_streak
FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 2. DESMARCAR treino
UPDATE workout_tracking
SET completed = false, updated_at = NOW()
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

SELECT 'DEPOIS DE DESMARCAR' as momento,
  workouts_completed,
  is_active_day
FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' AND date = CURRENT_DATE;

SELECT 'DEPOIS DE DESMARCAR' as momento,
  total_workouts,
  current_streak,
  longest_streak
FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- Deve mostrar:
-- DEPOIS DE MARCAR: workouts_completed=1, is_active_day=true, current_streak≥1
-- DEPOIS DE DESMARCAR: workouts_completed=0, is_active_day=false, current_streak=0 (se só tinha hoje)
