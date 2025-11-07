-- =====================================================
-- GAMIFICAÇÃO: Sincronização com Sistema de Tracking
-- =====================================================
-- Este arquivo cria triggers para atualizar automaticamente
-- daily_stats e user_stats quando o aluno marcar refeições,
-- treinos ou enviar fotos.

-- =====================================================
-- FUNÇÃO: Sincronizar meal_tracking com daily_stats
-- =====================================================

CREATE OR REPLACE FUNCTION sync_meal_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_meals_today INT;
  completed_meals_today INT;
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
    total_meals_today,
    completed_meals_today,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    meals_planned = total_meals_today,
    meals_completed = completed_meals_today,
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

-- Trigger para meal_tracking
DROP TRIGGER IF EXISTS trigger_sync_meal_tracking ON meal_tracking;
CREATE TRIGGER trigger_sync_meal_tracking
  AFTER INSERT OR UPDATE OR DELETE ON meal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_meal_tracking_to_daily_stats();

-- =====================================================
-- FUNÇÃO: Sincronizar workout_tracking com daily_stats
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

-- Trigger para workout_tracking
DROP TRIGGER IF EXISTS trigger_sync_workout_tracking ON workout_tracking;
CREATE TRIGGER trigger_sync_workout_tracking
  AFTER INSERT OR UPDATE OR DELETE ON workout_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_workout_tracking_to_daily_stats();

-- =====================================================
-- FUNÇÃO: Sincronizar progress_photos com daily_stats
-- =====================================================

CREATE OR REPLACE FUNCTION sync_progress_photos_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  photo_date DATE;
BEGIN
  -- Determinar a data da foto
  photo_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

  -- Contar fotos enviadas nessa data
  INSERT INTO daily_stats (
    aluno_id,
    date,
    photos_uploaded,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    photo_date,
    (
      SELECT COUNT(*)
      FROM progress_photos
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND DATE(created_at) = photo_date
    ),
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    photos_uploaded = (
      SELECT COUNT(*)
      FROM progress_photos
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND DATE(created_at) = photo_date
    ),
    updated_at = NOW();

  -- Atualizar user_stats totais
  UPDATE user_stats
  SET
    total_photos = (
      SELECT COUNT(*)
      FROM progress_photos
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
    ),
    current_week_photo_percentage = (
      SELECT CASE
        WHEN 4 = 0 THEN 0
        ELSE LEAST((COUNT(*)::DECIMAL / 4 * 100), 100)
      END
      FROM progress_photos
      WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
        AND DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)
        AND DATE(created_at) < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    ),
    updated_at = NOW()
  WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para progress_photos
DROP TRIGGER IF EXISTS trigger_sync_progress_photos ON progress_photos;
CREATE TRIGGER trigger_sync_progress_photos
  AFTER INSERT OR UPDATE OR DELETE ON progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION sync_progress_photos_to_daily_stats();

-- =====================================================
-- FUNÇÃO: Sincronizar dados históricos (executar 1x)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_historical_tracking_data()
RETURNS void AS $$
DECLARE
  aluno_record RECORD;
  date_record RECORD;
BEGIN
  -- Para cada aluno
  FOR aluno_record IN
    SELECT DISTINCT id FROM profiles WHERE role = 'aluno'
  LOOP
    -- Criar user_stats se não existir
    INSERT INTO user_stats (aluno_id)
    VALUES (aluno_record.id)
    ON CONFLICT (aluno_id) DO NOTHING;

    -- Para cada data com tracking
    FOR date_record IN
      SELECT DISTINCT DATE(created_at) as track_date
      FROM meal_tracking
      WHERE aluno_id = aluno_record.id
      UNION
      SELECT DISTINCT date as track_date
      FROM workout_tracking
      WHERE aluno_id = aluno_record.id
      UNION
      SELECT DISTINCT DATE(created_at) as track_date
      FROM progress_photos
      WHERE aluno_id = aluno_record.id
      ORDER BY track_date
    LOOP
      -- Inserir ou atualizar daily_stats
      INSERT INTO daily_stats (
        aluno_id,
        date,
        meals_planned,
        meals_completed,
        workouts_planned,
        workouts_completed,
        photos_uploaded
      )
      VALUES (
        aluno_record.id,
        date_record.track_date,
        (SELECT COUNT(*) FROM meal_tracking
         WHERE aluno_id = aluno_record.id
           AND DATE(created_at) = date_record.track_date),
        (SELECT COUNT(*) FROM meal_tracking
         WHERE aluno_id = aluno_record.id
           AND DATE(created_at) = date_record.track_date
           AND completed = true),
        (SELECT COUNT(*) FROM workout_tracking
         WHERE aluno_id = aluno_record.id
           AND date = date_record.track_date),
        (SELECT COUNT(*) FROM workout_tracking
         WHERE aluno_id = aluno_record.id
           AND date = date_record.track_date
           AND completed = true),
        (SELECT COUNT(*) FROM progress_photos
         WHERE aluno_id = aluno_record.id
           AND DATE(created_at) = date_record.track_date)
      )
      ON CONFLICT (aluno_id, date) DO UPDATE SET
        meals_planned = EXCLUDED.meals_planned,
        meals_completed = EXCLUDED.meals_completed,
        workouts_planned = EXCLUDED.workouts_planned,
        workouts_completed = EXCLUDED.workouts_completed,
        photos_uploaded = EXCLUDED.photos_uploaded,
        updated_at = NOW();
    END LOOP;

    -- Atualizar user_stats totais
    UPDATE user_stats
    SET
      total_meals_completed = (
        SELECT COUNT(*) FROM meal_tracking
        WHERE aluno_id = aluno_record.id AND completed = true
      ),
      total_workouts = (
        SELECT COUNT(*) FROM workout_tracking
        WHERE aluno_id = aluno_record.id AND completed = true
      ),
      total_photos = (
        SELECT COUNT(*) FROM progress_photos
        WHERE aluno_id = aluno_record.id
      ),
      current_month_meal_percentage = (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*) * 100)
        END
        FROM meal_tracking
        WHERE aluno_id = aluno_record.id
          AND DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)
          AND DATE(created_at) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      ),
      current_month_workout_percentage = (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*) * 100)
        END
        FROM workout_tracking
        WHERE aluno_id = aluno_record.id
          AND date >= DATE_TRUNC('month', CURRENT_DATE)
          AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      ),
      current_week_photo_percentage = (
        SELECT CASE
          WHEN 4 = 0 THEN 0
          ELSE LEAST((COUNT(*)::DECIMAL / 4 * 100), 100)
        END
        FROM progress_photos
        WHERE aluno_id = aluno_record.id
          AND DATE(created_at) >= DATE_TRUNC('week', CURRENT_DATE)
          AND DATE(created_at) < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      ),
      updated_at = NOW()
    WHERE aluno_id = aluno_record.id;
  END LOOP;

  RAISE NOTICE 'Sincronização de dados históricos concluída!';
END;
$$ LANGUAGE plpgsql;

-- Executar a sincronização de dados históricos
SELECT sync_historical_tracking_data();

-- =====================================================
-- ÍNDICES ADICIONAIS para Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_meal_tracking_aluno_date
  ON meal_tracking(aluno_id, created_at);

CREATE INDEX IF NOT EXISTS idx_workout_tracking_aluno_date
  ON workout_tracking(aluno_id, workout_date);

CREATE INDEX IF NOT EXISTS idx_progress_photos_aluno_date
  ON progress_photos(aluno_id, created_at);

-- =====================================================
-- FIM
-- =====================================================
