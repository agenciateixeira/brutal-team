-- ============================================
-- FIX AUTOMÁTICO DE TUDO
-- ============================================
-- Este SQL conserta:
-- 1. Comunidade não aparecendo
-- 2. Dashboard não atualizando
-- 3. Triggers não funcionando

-- ===== PASSO 1: GARANTIR COMUNIDADE =====

-- 1.1 Adicionar TODOS os alunos à comunidade pública
INSERT INTO community_members (community_id, aluno_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'member'
FROM profiles
WHERE role = 'aluno'
ON CONFLICT (community_id, aluno_id) DO NOTHING;

RAISE NOTICE '✅ Todos alunos adicionados à comunidade';

-- ===== PASSO 2: RECRIAR FUNÇÕES DE GAMIFICAÇÃO =====

-- 2.1 Função de workout_tracking
CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  total_workouts INT;
  completed_workouts INT;
BEGIN
  -- Data do registro
  track_date := COALESCE(NEW.date, OLD.date);

  -- Contar treinos nessa data
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts, completed_workouts
  FROM workout_tracking
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    AND date = track_date;

  -- Atualizar daily_stats
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

  -- Atualizar user_stats
  UPDATE user_stats
  SET
    total_workouts = (
      SELECT COUNT(*) FROM workout_tracking
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
    -- Atualizar streak se o dia é ativo
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

RAISE NOTICE '✅ Função de workout_tracking recriada';

-- 2.2 Função de meal_tracking
CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  track_date DATE;
  meals_count INT;
BEGIN
  -- Data do registro
  track_date := COALESCE(NEW.date, OLD.date);

  -- Contar refeições marcadas
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

  -- Atualizar daily_stats
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

  -- Atualizar user_stats
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

RAISE NOTICE '✅ Função de meal_tracking recriada';

-- ===== PASSO 3: RECRIAR TRIGGERS =====

-- 3.1 Dropar triggers antigos
DROP TRIGGER IF EXISTS trigger_sync_workout_tracking ON workout_tracking;
DROP TRIGGER IF EXISTS trigger_sync_meal_tracking ON meal_tracking;

-- 3.2 Criar triggers novos
CREATE TRIGGER trigger_sync_workout_tracking
  AFTER INSERT OR UPDATE OR DELETE ON workout_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_workout_tracking_to_daily_stats();

CREATE TRIGGER trigger_sync_meal_tracking
  AFTER INSERT OR UPDATE OR DELETE ON meal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_meal_tracking_to_daily_stats();

RAISE NOTICE '✅ Triggers recriados';

-- ===== PASSO 4: FORÇAR ATUALIZAÇÃO DE HOJE =====

-- 4.1 Atualizar todos os registros de hoje para disparar triggers
UPDATE workout_tracking
SET updated_at = NOW()
WHERE date = CURRENT_DATE;

UPDATE meal_tracking
SET updated_at = NOW()
WHERE date = CURRENT_DATE;

RAISE NOTICE '✅ Dados de hoje atualizados';

-- ===== PASSO 5: VERIFICAR RESULTADOS =====

-- 5.1 Ver alunos na comunidade
SELECT
  'COMUNIDADE' as tipo,
  COUNT(*) as total
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- 5.2 Ver daily_stats de hoje
SELECT
  'DAILY_STATS' as tipo,
  p.full_name,
  ds.workouts_completed,
  ds.meals_completed
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- 5.3 Ver user_stats
SELECT
  'USER_STATS' as tipo,
  p.full_name,
  us.current_streak,
  us.total_workouts,
  us.total_meals_completed
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
ORDER BY p.full_name;
