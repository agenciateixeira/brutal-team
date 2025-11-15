-- ============================================
-- FIX: Gamificação - Streak e Dias Seguidos
-- ============================================
-- O problema: is_active_day não está sendo marcado como TRUE
-- quando o aluno completa treinos/refeições

-- =====================================================
-- 1. ATUALIZAR FUNÇÃO DE WORKOUT TRACKING
-- =====================================================

CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_workouts_today INT;
  completed_workouts_today INT;
  total_meals_today INT;
  completed_meals_today INT;
  workout_percentage DECIMAL;
  meal_percentage DECIMAL;
  overall_percentage DECIMAL;
  is_active BOOLEAN;
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

  -- Contar refeições de hoje (para calcular se o dia é ativo)
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_meals_today, completed_meals_today
  FROM meal_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND DATE(created_at) = today_date;

  -- Calcular percentuais
  workout_percentage := CASE
    WHEN total_workouts_today > 0 THEN
      (completed_workouts_today::DECIMAL / total_workouts_today * 100)
    ELSE 0
  END;

  meal_percentage := CASE
    WHEN total_meals_today > 0 THEN
      (completed_meals_today::DECIMAL / total_meals_today * 100)
    ELSE 0
  END;

  -- Calcular percentual geral (média de treinos e refeições)
  -- Se não tem refeições planejadas, considera apenas treinos
  IF total_meals_today > 0 THEN
    overall_percentage := (workout_percentage + meal_percentage) / 2;
  ELSE
    overall_percentage := workout_percentage;
  END IF;

  -- Dia é considerado ativo se fez pelo menos 70% das atividades
  is_active := overall_percentage >= 70;

  -- Inserir ou atualizar daily_stats
  INSERT INTO daily_stats (
    aluno_id,
    date,
    workouts_planned,
    workouts_completed,
    meals_planned,
    meals_completed,
    is_active_day,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    today_date,
    total_workouts_today,
    completed_workouts_today,
    total_meals_today,
    completed_meals_today,
    is_active,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = total_workouts_today,
    workouts_completed = completed_workouts_today,
    meals_planned = total_meals_today,
    meals_completed = completed_meals_today,
    is_active_day = is_active,
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
-- 2. ATUALIZAR FUNÇÃO DE MEAL TRACKING
-- =====================================================

CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_meals_today INT;
  completed_meals_today INT;
  total_workouts_today INT;
  completed_workouts_today INT;
  workout_percentage DECIMAL;
  meal_percentage DECIMAL;
  overall_percentage DECIMAL;
  is_active BOOLEAN;
BEGIN
  -- Contar total de refeições planejadas para hoje
  SELECT COUNT(*)
  INTO total_meals_today
  FROM meal_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND DATE(created_at) = today_date;

  -- Contar refeições completadas hoje
  SELECT COUNT(*)
  INTO completed_meals_today
  FROM meal_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND DATE(created_at) = today_date
    AND completed = true;

  -- Contar treinos de hoje (para calcular se o dia é ativo)
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts_today, completed_workouts_today
  FROM workout_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = today_date;

  -- Calcular percentuais
  workout_percentage := CASE
    WHEN total_workouts_today > 0 THEN
      (completed_workouts_today::DECIMAL / total_workouts_today * 100)
    ELSE 0
  END;

  meal_percentage := CASE
    WHEN total_meals_today > 0 THEN
      (completed_meals_today::DECIMAL / total_meals_today * 100)
    ELSE 0
  END;

  -- Calcular percentual geral (média de treinos e refeições)
  -- Se não tem treinos planejados, considera apenas refeições
  IF total_workouts_today > 0 THEN
    overall_percentage := (workout_percentage + meal_percentage) / 2;
  ELSE
    overall_percentage := meal_percentage;
  END IF;

  -- Dia é considerado ativo se fez pelo menos 70% das atividades
  is_active := overall_percentage >= 70;

  -- Inserir ou atualizar daily_stats
  INSERT INTO daily_stats (
    aluno_id,
    date,
    meals_planned,
    meals_completed,
    workouts_planned,
    workouts_completed,
    is_active_day,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    today_date,
    total_meals_today,
    completed_meals_today,
    total_workouts_today,
    completed_workouts_today,
    is_active,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    meals_planned = total_meals_today,
    meals_completed = completed_meals_today,
    workouts_planned = total_workouts_today,
    workouts_completed = completed_workouts_today,
    is_active_day = is_active,
    updated_at = NOW();

  -- Atualizar user_stats totais
  UPDATE user_stats
  SET
    total_meals_completed = (
      SELECT COUNT(*)
      FROM meal_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND completed = true
    ),
    current_month_meal_percentage = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*) * 100)
      END
      FROM meal_tracking
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)
        AND DATE(created_at) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ),
    updated_at = NOW()
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. REPROCESSAR DADOS HISTÓRICOS
-- =====================================================
-- Recalcular is_active_day para todos os dias anteriores

DO $$
DECLARE
  stats_record RECORD;
  workout_pct DECIMAL;
  meal_pct DECIMAL;
  overall_pct DECIMAL;
BEGIN
  FOR stats_record IN
    SELECT * FROM daily_stats ORDER BY date
  LOOP
    -- Calcular percentuais
    workout_pct := CASE
      WHEN stats_record.workouts_planned > 0 THEN
        (stats_record.workouts_completed::DECIMAL / stats_record.workouts_planned * 100)
      ELSE 0
    END;

    meal_pct := CASE
      WHEN stats_record.meals_planned > 0 THEN
        (stats_record.meals_completed::DECIMAL / stats_record.meals_planned * 100)
      ELSE 0
    END;

    -- Calcular percentual geral
    IF stats_record.workouts_planned > 0 AND stats_record.meals_planned > 0 THEN
      overall_pct := (workout_pct + meal_pct) / 2;
    ELSIF stats_record.workouts_planned > 0 THEN
      overall_pct := workout_pct;
    ELSE
      overall_pct := meal_pct;
    END IF;

    -- Atualizar is_active_day
    UPDATE daily_stats
    SET is_active_day = (overall_pct >= 70)
    WHERE id = stats_record.id;
  END LOOP;

  RAISE NOTICE 'Recalculação de is_active_day concluída!';
END $$;

-- =====================================================
-- 4. RECALCULAR STREAKS
-- =====================================================
-- Forçar recálculo das streaks baseado nos daily_stats atualizados

DO $$
DECLARE
  aluno_record RECORD;
  day_record RECORD;
  current_streak_count INT := 0;
  longest_streak_count INT := 0;
  last_date DATE := NULL;
BEGIN
  FOR aluno_record IN
    SELECT DISTINCT aluno_id FROM daily_stats
  LOOP
    current_streak_count := 0;
    longest_streak_count := 0;
    last_date := NULL;

    -- Processar dias ativos em ordem cronológica
    FOR day_record IN
      SELECT date FROM daily_stats
      WHERE aluno_id = aluno_record.aluno_id
        AND is_active_day = TRUE
      ORDER BY date ASC
    LOOP
      -- Se é o primeiro dia ou é consecutivo
      IF last_date IS NULL OR day_record.date = last_date + INTERVAL '1 day' THEN
        current_streak_count := current_streak_count + 1;
      ELSE
        -- Streak quebrada, resetar
        current_streak_count := 1;
      END IF;

      -- Atualizar recorde se necessário
      IF current_streak_count > longest_streak_count THEN
        longest_streak_count := current_streak_count;
      END IF;

      last_date := day_record.date;
    END LOOP;

    -- Atualizar user_stats
    UPDATE user_stats
    SET
      current_streak = current_streak_count,
      longest_streak = longest_streak_count,
      last_active_date = last_date,
      total_active_days = (
        SELECT COUNT(*) FROM daily_stats
        WHERE aluno_id = aluno_record.aluno_id AND is_active_day = TRUE
      )
    WHERE aluno_id = aluno_record.aluno_id;
  END LOOP;

  RAISE NOTICE 'Recalculação de streaks concluída!';
END $$;

-- =====================================================
-- 5. VERIFICAR RESULTADOS
-- =====================================================

SELECT
  p.full_name,
  us.current_streak as dias_seguidos,
  us.longest_streak as recorde,
  us.total_workouts as treinos_concluidos,
  us.total_active_days as dias_ativos
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
ORDER BY us.current_streak DESC;
