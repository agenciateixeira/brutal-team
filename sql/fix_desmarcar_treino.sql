-- ============================================
-- FIX: Desmarcar treino deve atualizar dashboard
-- ============================================

DROP FUNCTION IF EXISTS sync_workout_tracking_to_daily_stats() CASCADE;

CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  total_workouts INT;
  completed_workouts INT;
  current_aluno_id UUID;
  streak_count INT;
  longest INT;
BEGIN
  -- Pegar data e aluno_id (funciona para INSERT, UPDATE e DELETE)
  track_date := COALESCE(NEW.date, OLD.date);
  current_aluno_id := COALESCE(NEW.aluno_id, OLD.aluno_id);

  -- Contar workouts ATUAIS (após a mudança)
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts, completed_workouts
  FROM workout_tracking
  WHERE aluno_id = current_aluno_id
    AND date = track_date;

  -- Atualizar daily_stats
  INSERT INTO daily_stats (aluno_id, date, workouts_planned, workouts_completed, is_active_day, updated_at)
  VALUES (
    current_aluno_id,
    track_date,
    total_workouts,
    completed_workouts,
    completed_workouts > 0,  -- is_active_day só TRUE se tem workout completado
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = EXCLUDED.workouts_planned,
    workouts_completed = EXCLUDED.workouts_completed,
    is_active_day = EXCLUDED.is_active_day,  -- IMPORTANTE: atualiza is_active_day
    updated_at = NOW();

  -- Recalcular streak baseado em TODOS os dias ativos
  -- (não apenas incrementar, mas RECALCULAR de verdade)
  WITH active_days AS (
    SELECT date
    FROM daily_stats
    WHERE aluno_id = current_aluno_id
      AND is_active_day = true
    ORDER BY date DESC
  ),
  streak_calc AS (
    SELECT COUNT(*) as streak
    FROM (
      SELECT
        date,
        date - (ROW_NUMBER() OVER (ORDER BY date DESC))::int as grp
      FROM active_days
    ) sub
    WHERE grp = (SELECT date - 1 FROM active_days LIMIT 1)
       OR date = CURRENT_DATE
  )
  SELECT COALESCE(streak, 0) INTO streak_count FROM streak_calc;

  -- Pegar longest streak existente
  SELECT COALESCE(longest_streak, 0) INTO longest
  FROM user_stats
  WHERE aluno_id = current_aluno_id;

  -- Atualizar user_stats com RECÁLCULO completo
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
    GREATEST(longest, streak_count),  -- Mantém o maior entre o antigo e o novo
    (SELECT COUNT(DISTINCT date) FROM daily_stats WHERE aluno_id = current_aluno_id AND is_active_day = true),
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

-- Testar: marcar e desmarcar
-- 1. Marcar treino de hoje
INSERT INTO workout_tracking (aluno_id, date, completed)
VALUES ('501a3efe-84a6-4c71-b135-4c59b41a4e0e', CURRENT_DATE, true)
ON CONFLICT (aluno_id, date)
DO UPDATE SET completed = true, updated_at = NOW();

-- Ver resultado
SELECT 'DEPOIS DE MARCAR' as momento, * FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' AND date = CURRENT_DATE;

SELECT 'DEPOIS DE MARCAR' as momento, * FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';

-- 2. DESMARCAR treino de hoje
UPDATE workout_tracking
SET completed = false, updated_at = NOW()
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

-- Ver resultado APÓS DESMARCAR
SELECT 'DEPOIS DE DESMARCAR' as momento, * FROM daily_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e' AND date = CURRENT_DATE;

SELECT 'DEPOIS DE DESMARCAR' as momento, * FROM user_stats
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
