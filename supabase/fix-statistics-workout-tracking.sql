-- ============================================
-- CORREÇÃO: Atualizar funções de estatísticas
-- para usar workout_types_completed ao invés de completed
-- ============================================

-- 1. Atualizar get_aluno_statistics
CREATE OR REPLACE FUNCTION get_aluno_statistics(aluno_user_id UUID)
RETURNS TABLE (
  refeicoes_percentage NUMERIC,
  treinos_percentage NUMERIC,
  protocolos_percentage NUMERIC,
  current_streak INTEGER,
  best_streak INTEGER,
  total_days_tracked INTEGER,
  last_7_days_percentage NUMERIC,
  last_30_days_percentage NUMERIC,
  trend TEXT
) AS $$
DECLARE
  v_meals_per_day INTEGER;
  v_total_expected_meals INTEGER;
  v_total_completed_meals INTEGER;
  v_total_expected_workouts INTEGER;
  v_total_completed_workouts INTEGER;
  v_total_expected_protocols INTEGER;
  v_total_completed_protocols INTEGER;
  v_current_streak INTEGER := 0;
  v_best_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_last_7_avg NUMERIC;
  v_last_30_avg NUMERIC;
  v_trend TEXT;
BEGIN
  -- Pega meals_per_day da dieta ativa
  SELECT COALESCE(d.meals_per_day, 6) INTO v_meals_per_day
  FROM dietas d
  WHERE d.aluno_id = aluno_user_id AND d.active = true
  LIMIT 1;

  -- Calcula refeições (últimos 30 dias)
  v_total_expected_meals := v_meals_per_day * 30;

  SELECT COALESCE(SUM(
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_manha THEN 1 ELSE 0 END) +
    (CASE WHEN almoco THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_tarde THEN 1 ELSE 0 END) +
    (CASE WHEN janta THEN 1 ELSE 0 END) +
    (CASE WHEN ceia THEN 1 ELSE 0 END)
  ), 0)::INTEGER INTO v_total_completed_meals
  FROM meal_tracking
  WHERE aluno_id = aluno_user_id
    AND date >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula treinos (últimos 30 dias)
  -- CORRIGIDO: Conta dias onde workout_types_completed tem pelo menos 1 elemento
  v_total_expected_workouts := 21;

  SELECT COUNT(*) INTO v_total_completed_workouts
  FROM workout_tracking
  WHERE aluno_id = aluno_user_id
    AND array_length(workout_types_completed, 1) > 0
    AND date >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula protocolos (últimos 30 dias)
  v_total_expected_protocols := 30;

  SELECT COUNT(*) INTO v_total_completed_protocols
  FROM protocol_tracking
  WHERE aluno_id = aluno_user_id
    AND completed = true
    AND date >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula sequência atual (dias consecutivos com pelo menos 1 atividade)
  WITH daily_activity AS (
    SELECT DISTINCT date as activity_date
    FROM (
      -- Dias com pelo menos uma refeição
      SELECT date FROM meal_tracking
      WHERE aluno_id = aluno_user_id
        AND (cafe_da_manha OR lanche_manha OR almoco OR lanche_tarde OR janta OR ceia)
      UNION
      -- Dias com treino completado (CORRIGIDO)
      SELECT date FROM workout_tracking
      WHERE aluno_id = aluno_user_id AND array_length(workout_types_completed, 1) > 0
      UNION
      -- Dias com protocolo completado
      SELECT date FROM protocol_tracking
      WHERE aluno_id = aluno_user_id AND completed = true
    ) all_activities
    ORDER BY activity_date DESC
  ),
  streaks AS (
    SELECT
      activity_date,
      activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::INTEGER AS streak_group
    FROM daily_activity
  )
  SELECT
    COALESCE(MAX(streak_length), 0),
    COALESCE(MAX(CASE WHEN is_current THEN streak_length ELSE 0 END), 0)
  INTO v_best_streak, v_current_streak
  FROM (
    SELECT
      COUNT(*) as streak_length,
      MAX(activity_date) = CURRENT_DATE as is_current
    FROM streaks
    GROUP BY streak_group
  ) streak_counts;

  -- Calcula média últimos 7 dias vs últimos 30
  WITH last_7 AS (
    SELECT COUNT(DISTINCT date) as active_days
    FROM (
      SELECT date FROM meal_tracking
      WHERE aluno_id = aluno_user_id
        AND (cafe_da_manha OR lanche_manha OR almoco OR lanche_tarde OR janta OR ceia)
        AND date >= CURRENT_DATE - 7
      UNION
      SELECT date FROM workout_tracking
      WHERE aluno_id = aluno_user_id AND array_length(workout_types_completed, 1) > 0 AND date >= CURRENT_DATE - 7
      UNION
      SELECT date FROM protocol_tracking
      WHERE aluno_id = aluno_user_id AND completed = true AND date >= CURRENT_DATE - 7
    ) activities_7
  ),
  last_30 AS (
    SELECT COUNT(DISTINCT date) as active_days
    FROM (
      SELECT date FROM meal_tracking
      WHERE aluno_id = aluno_user_id
        AND (cafe_da_manha OR lanche_manha OR almoco OR lanche_tarde OR janta OR ceia)
        AND date >= CURRENT_DATE - 30
      UNION
      SELECT date FROM workout_tracking
      WHERE aluno_id = aluno_user_id AND array_length(workout_types_completed, 1) > 0 AND date >= CURRENT_DATE - 30
      UNION
      SELECT date FROM protocol_tracking
      WHERE aluno_id = aluno_user_id AND completed = true AND date >= CURRENT_DATE - 30
    ) activities_30
  )
  SELECT
    ROUND((l7.active_days::NUMERIC / 7) * 100, 0),
    ROUND((l30.active_days::NUMERIC / 30) * 100, 0)
  INTO v_last_7_avg, v_last_30_avg
  FROM last_7 l7, last_30 l30;

  -- Determina tendência
  IF v_last_7_avg > v_last_30_avg + 10 THEN
    v_trend := 'improving';
  ELSIF v_last_7_avg < v_last_30_avg - 10 THEN
    v_trend := 'declining';
  ELSE
    v_trend := 'stable';
  END IF;

  -- Retorna resultados
  RETURN QUERY SELECT
    ROUND((v_total_completed_meals::NUMERIC / NULLIF(v_total_expected_meals, 0)) * 100, 0) as refeicoes_percentage,
    ROUND((v_total_completed_workouts::NUMERIC / NULLIF(v_total_expected_workouts, 0)) * 100, 0) as treinos_percentage,
    ROUND((v_total_completed_protocols::NUMERIC / NULLIF(v_total_expected_protocols, 0)) * 100, 0) as protocolos_percentage,
    v_current_streak as current_streak,
    v_best_streak as best_streak,
    30 as total_days_tracked,
    v_last_7_avg as last_7_days_percentage,
    v_last_30_avg as last_30_days_percentage,
    v_trend as trend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar get_today_summary
CREATE OR REPLACE FUNCTION get_today_summary(aluno_user_id UUID)
RETURNS TABLE (
  meals_completed INTEGER,
  meals_total INTEGER,
  workouts_completed INTEGER,
  workouts_total INTEGER,
  next_meal_time TIME,
  next_meal_name TEXT,
  next_workout_time TIME,
  next_workout_name TEXT
) AS $$
DECLARE
  v_meals_per_day INTEGER;
  v_meals_completed INTEGER;
  v_workouts_completed INTEGER;
  v_workout_types_count INTEGER;
BEGIN
  -- Pega meals_per_day da dieta ativa
  SELECT COALESCE(d.meals_per_day, 6) INTO v_meals_per_day
  FROM dietas d
  WHERE d.aluno_id = aluno_user_id AND d.active = true
  LIMIT 1;

  -- Conta quantas refeições foram completadas hoje
  SELECT COALESCE(SUM(
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_manha THEN 1 ELSE 0 END) +
    (CASE WHEN almoco THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_tarde THEN 1 ELSE 0 END) +
    (CASE WHEN janta THEN 1 ELSE 0 END) +
    (CASE WHEN ceia THEN 1 ELSE 0 END)
  ), 0)::INTEGER INTO v_meals_completed
  FROM meal_tracking
  WHERE aluno_id = aluno_user_id AND date = CURRENT_DATE;

  -- CORRIGIDO: Conta quantos tipos de treino foram completados hoje
  SELECT COALESCE(SUM(array_length(workout_types_completed, 1)), 0)::INTEGER
  INTO v_workouts_completed
  FROM workout_tracking
  WHERE aluno_id = aluno_user_id AND date = CURRENT_DATE;

  -- Pega quantos tipos de treino o aluno tem configurado
  SELECT COALESCE(array_length(t.workout_types, 1), 2)
  INTO v_workout_types_count
  FROM treinos t
  WHERE t.aluno_id = aluno_user_id AND t.active = true
  LIMIT 1;

  RETURN QUERY
  SELECT
    v_meals_completed,
    v_meals_per_day,
    v_workouts_completed,
    v_workout_types_count, -- Total de tipos de treino esperados
    NULL::TIME, -- Próxima refeição (pode ser calculado com horários)
    NULL::TEXT, -- Nome próxima refeição
    NULL::TIME, -- Próximo treino
    NULL::TEXT; -- Nome próximo treino
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar a view coach_alunos_stats
DROP VIEW IF EXISTS coach_alunos_stats;

CREATE OR REPLACE VIEW coach_alunos_stats AS
SELECT
  p.id as aluno_id,
  p.full_name as aluno_name,
  p.email as aluno_email,
  p.avatar_url,
  (
    SELECT ROUND(AVG(percentage), 0)
    FROM (
      -- Refeições
      SELECT
        COALESCE(
          (SELECT SUM(
            (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END) +
            (CASE WHEN lanche_manha THEN 1 ELSE 0 END) +
            (CASE WHEN almoco THEN 1 ELSE 0 END) +
            (CASE WHEN lanche_tarde THEN 1 ELSE 0 END) +
            (CASE WHEN janta THEN 1 ELSE 0 END) +
            (CASE WHEN ceia THEN 1 ELSE 0 END)
          ) * 100.0 / NULLIF((SELECT meals_per_day FROM dietas WHERE aluno_id = p.id AND active = true LIMIT 1) * 30, 0)
           FROM meal_tracking WHERE aluno_id = p.id AND date >= CURRENT_DATE - 30),
          0
        ) as percentage
      UNION ALL
      -- Treinos (CORRIGIDO)
      SELECT
        COALESCE(
          (SELECT COUNT(*) * 100.0 / 21
           FROM workout_tracking WHERE aluno_id = p.id AND array_length(workout_types_completed, 1) > 0 AND date >= CURRENT_DATE - 30),
          0
        )
      UNION ALL
      -- Protocolos
      SELECT
        COALESCE(
          (SELECT COUNT(*) * 100.0 / 30
           FROM protocol_tracking WHERE aluno_id = p.id AND completed = true AND date >= CURRENT_DATE - 30),
          0
        )
    ) percentages
  ) as adesao_geral,
  (SELECT COALESCE(SUM(
    (CASE WHEN cafe_da_manha THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_manha THEN 1 ELSE 0 END) +
    (CASE WHEN almoco THEN 1 ELSE 0 END) +
    (CASE WHEN lanche_tarde THEN 1 ELSE 0 END) +
    (CASE WHEN janta THEN 1 ELSE 0 END) +
    (CASE WHEN ceia THEN 1 ELSE 0 END)
  ), 0) FROM meal_tracking WHERE aluno_id = p.id AND date = CURRENT_DATE) as refeicoes_hoje,
  (SELECT COALESCE(SUM(array_length(workout_types_completed, 1)), 0) FROM workout_tracking WHERE aluno_id = p.id AND date = CURRENT_DATE) as treinos_hoje
FROM profiles p
WHERE p.role = 'aluno';

-- ✅ Funções corrigidas para usar workout_types_completed!
