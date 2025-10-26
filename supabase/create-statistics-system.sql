-- ============================================
-- SISTEMA DE ESTATÍSTICAS E DASHBOARD
-- Views e funções para cálculos de adesão
-- ============================================

-- 1. Função para calcular estatísticas do aluno (últimos 30 dias)
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

  SELECT COUNT(*) INTO v_total_completed_meals
  FROM meal_tracking
  WHERE aluno_id = aluno_user_id
    AND completed = true
    AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula treinos (últimos 30 dias)
  -- Assumindo 5 treinos por semana = ~21 treinos em 30 dias
  v_total_expected_workouts := 21;

  SELECT COUNT(*) INTO v_total_completed_workouts
  FROM workout_tracking
  WHERE aluno_id = aluno_user_id
    AND completed = true
    AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula protocolos (últimos 30 dias)
  -- Assumindo 1 protocolo por dia
  v_total_expected_protocols := 30;

  SELECT COUNT(*) INTO v_total_completed_protocols
  FROM protocol_tracking
  WHERE aluno_id = aluno_user_id
    AND completed = true
    AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days';

  -- Calcula sequência atual (dias consecutivos com pelo menos 1 atividade)
  WITH daily_activity AS (
    SELECT DISTINCT DATE(created_at) as activity_date
    FROM (
      SELECT created_at FROM meal_tracking WHERE aluno_id = aluno_user_id AND completed = true
      UNION ALL
      SELECT created_at FROM workout_tracking WHERE aluno_id = aluno_user_id AND completed = true
      UNION ALL
      SELECT created_at FROM protocol_tracking WHERE aluno_id = aluno_user_id AND completed = true
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
    SELECT COUNT(DISTINCT DATE(created_at)) as active_days
    FROM (
      SELECT created_at FROM meal_tracking WHERE aluno_id = aluno_user_id AND completed = true AND created_at >= CURRENT_DATE - 7
      UNION ALL
      SELECT created_at FROM workout_tracking WHERE aluno_id = aluno_user_id AND completed = true AND created_at >= CURRENT_DATE - 7
    ) activities_7
  ),
  last_30 AS (
    SELECT COUNT(DISTINCT DATE(created_at)) as active_days
    FROM (
      SELECT created_at FROM meal_tracking WHERE aluno_id = aluno_user_id AND completed = true AND created_at >= CURRENT_DATE - 30
      UNION ALL
      SELECT created_at FROM workout_tracking WHERE aluno_id = aluno_user_id AND completed = true AND created_at >= CURRENT_DATE - 30
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

-- 2. Função para pegar resumo do dia atual (Dashboard Aluno)
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
BEGIN
  -- Pega meals_per_day da dieta ativa
  SELECT COALESCE(d.meals_per_day, 6) INTO v_meals_per_day
  FROM dietas d
  WHERE d.aluno_id = aluno_user_id AND d.active = true
  LIMIT 1;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM meal_tracking WHERE aluno_id = aluno_user_id AND completed = true AND DATE(created_at) = CURRENT_DATE),
    v_meals_per_day,
    (SELECT COUNT(*)::INTEGER FROM workout_tracking WHERE aluno_id = aluno_user_id AND completed = true AND DATE(created_at) = CURRENT_DATE),
    2, -- Assumindo 2 treinos por dia em média
    NULL::TIME, -- Próxima refeição (pode ser calculado com horários)
    NULL::TEXT, -- Nome próxima refeição
    NULL::TIME, -- Próximo treino
    NULL::TEXT; -- Nome próximo treino
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. View para lista de alunos do coach com estatísticas resumidas
CREATE OR REPLACE VIEW coach_alunos_stats AS
SELECT
  p.id as aluno_id,
  p.full_name as aluno_name,
  p.email as aluno_email,
  p.avatar_url,
  p.coach_id,
  (
    SELECT ROUND(AVG(percentage), 0)
    FROM (
      SELECT
        COALESCE(
          (SELECT COUNT(*) * 100.0 / NULLIF((SELECT meals_per_day FROM dietas WHERE aluno_id = p.id AND active = true LIMIT 1) * 30, 0)
           FROM meal_tracking WHERE aluno_id = p.id AND completed = true AND created_at >= CURRENT_DATE - 30),
          0
        ) as percentage
      UNION ALL
      SELECT
        COALESCE(
          (SELECT COUNT(*) * 100.0 / 21
           FROM workout_tracking WHERE aluno_id = p.id AND completed = true AND created_at >= CURRENT_DATE - 30),
          0
        )
    ) percentages
  ) as adesao_geral,
  (SELECT COUNT(*) FROM meal_tracking WHERE aluno_id = p.id AND completed = true AND DATE(created_at) = CURRENT_DATE) as refeicoes_hoje,
  (SELECT COUNT(*) FROM workout_tracking WHERE aluno_id = p.id AND completed = true AND DATE(created_at) = CURRENT_DATE) as treinos_hoje
FROM profiles p
WHERE p.role = 'aluno';

-- 4. Comentários
COMMENT ON FUNCTION get_aluno_statistics IS 'Retorna estatísticas completas do aluno para os últimos 30 dias';
COMMENT ON FUNCTION get_today_summary IS 'Retorna resumo do dia atual para dashboard do aluno';
COMMENT ON VIEW coach_alunos_stats IS 'View com estatísticas resumidas de todos alunos para o coach';

-- ✅ Sistema de Estatísticas pronto!
