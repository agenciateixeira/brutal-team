-- ============================================
-- REVERTER PARA FUNCIONAL
-- ============================================
-- Voltar às funções originais que funcionavam

-- =====================================================
-- 1. RESTAURAR FUNÇÃO DE MEAL_TRACKING ORIGINAL
-- =====================================================

CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_meals_planned INT := 6;
  completed_meals_today INT;
BEGIN
  -- Contar quantas refeições foram marcadas hoje
  SELECT
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END +
     CASE WHEN lanche_manha THEN 1 ELSE 0 END +
     CASE WHEN almoco THEN 1 ELSE 0 END +
     CASE WHEN lanche_tarde THEN 1 ELSE 0 END +
     CASE WHEN janta THEN 1 ELSE 0 END +
     CASE WHEN ceia THEN 1 ELSE 0 END)
  INTO completed_meals_today
  FROM meal_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = today_date;

  completed_meals_today := COALESCE(completed_meals_today, 0);

  -- Inserir ou atualizar daily_stats
  INSERT INTO daily_stats (
    aluno_id,
    date,
    meals_planned,
    meals_completed,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    today_date,
    total_meals_planned,
    completed_meals_today,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    meals_planned = total_meals_planned,
    meals_completed = completed_meals_today,
    updated_at = NOW();

  -- Atualizar user_stats totais
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

-- =====================================================
-- 2. RESTAURAR FUNÇÃO DE WORKOUT_TRACKING ORIGINAL
-- =====================================================

CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_workouts_today INT;
  completed_workouts_today INT;
BEGIN
  -- Contar total de treinos planejados para hoje
  SELECT COUNT(*)
  INTO total_workouts_today
  FROM workout_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = today_date;

  -- Contar treinos completados hoje
  SELECT COUNT(*)
  INTO completed_workouts_today
  FROM workout_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = today_date
    AND completed = true;

  -- Inserir ou atualizar daily_stats
  INSERT INTO daily_stats (
    aluno_id,
    date,
    workouts_planned,
    workouts_completed,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    today_date,
    total_workouts_today,
    completed_workouts_today,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = total_workouts_today,
    workouts_completed = completed_workouts_today,
    updated_at = NOW();

  -- Atualizar user_stats totais
  UPDATE user_stats
  SET
    total_workouts = (
      SELECT COUNT(*)
      FROM workout_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND completed = true
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
    updated_at = NOW()
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. VERIFICAR TRIGGERS ATIVOS
-- =====================================================

SELECT
  event_object_table as tabela,
  trigger_name,
  event_manipulation as evento
FROM information_schema.triggers
WHERE event_object_table IN ('meal_tracking', 'workout_tracking')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 4. TESTAR MARCANDO UMA REFEIÇÃO AGORA
-- =====================================================

-- Marque uma refeição no app e execute esta query depois:
SELECT
  p.full_name,
  us.total_meals_completed,
  us.total_workouts,
  us.updated_at
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
