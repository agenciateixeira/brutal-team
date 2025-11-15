-- ============================================
-- FIX CORRETO: Streak baseado em Treino OU Foto
-- ============================================
-- Dia ativo = Treino completo OU Foto na comunidade
-- NÃO considera refeições para streak

-- =====================================================
-- 1. REVERTER FUNÇÕES PARA ORIGINAL (NÃO QUEBRAR)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_workout_tracking_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  total_workouts_today INT;
  completed_workouts_today INT;
  has_photo_today BOOLEAN;
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

  -- Verificar se tem foto postada hoje na comunidade
  SELECT EXISTS(
    SELECT 1 FROM community_posts
    WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
      AND DATE(created_at) = today_date
      AND has_photo = true
  ) INTO has_photo_today;

  -- Dia é ativo se: treino completo OU foto postada
  is_active := (completed_workouts_today > 0) OR has_photo_today;

  -- Inserir ou atualizar daily_stats
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
    today_date,
    total_workouts_today,
    completed_workouts_today,
    is_active,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = total_workouts_today,
    workouts_completed = completed_workouts_today,
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
-- 2. FUNÇÃO DE MEAL (NÃO AFETA STREAK, SÓ ATUALIZA STATS)
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

  -- Inserir ou atualizar daily_stats (SEM TOCAR em is_active_day)
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
  -- NÃO atualiza is_active_day aqui!

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
-- 3. FUNÇÃO PARA COMMUNITY_POSTS (MARCAR DIA ATIVO)
-- =====================================================

CREATE OR REPLACE FUNCTION sync_community_posts_to_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  post_date DATE;
  has_workout_today BOOLEAN;
  has_photo_today BOOLEAN;
  is_active BOOLEAN;
BEGIN
  -- Data do post
  post_date := DATE(COALESCE(NEW.created_at, OLD.created_at));

  -- Verificar se tem treino completo nessa data
  SELECT EXISTS(
    SELECT 1 FROM workout_tracking
    WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
      AND date = post_date
      AND completed = true
  ) INTO has_workout_today;

  -- Verificar se tem foto postada nessa data
  SELECT EXISTS(
    SELECT 1 FROM community_posts
    WHERE aluno_id = COALESCE(NEW.aluno_id, OLD.aluno_id)
      AND DATE(created_at) = post_date
      AND has_photo = true
  ) INTO has_photo_today;

  -- Dia é ativo se: treino completo OU foto postada
  is_active := has_workout_today OR has_photo_today;

  -- Atualizar is_active_day no daily_stats
  INSERT INTO daily_stats (
    aluno_id,
    date,
    is_active_day,
    updated_at
  )
  VALUES (
    COALESCE(NEW.aluno_id, OLD.aluno_id),
    post_date,
    is_active,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    is_active_day = is_active,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para community_posts
DROP TRIGGER IF EXISTS trigger_sync_community_posts ON community_posts;
CREATE TRIGGER trigger_sync_community_posts
  AFTER INSERT OR UPDATE OR DELETE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_community_posts_to_daily_stats();

-- =====================================================
-- 4. RECALCULAR is_active_day HISTÓRICO
-- =====================================================
-- Marcar como ativo APENAS dias com treino completo OU foto na comunidade

DO $$
DECLARE
  ds_record RECORD;
  has_workout BOOLEAN;
  has_photo BOOLEAN;
BEGIN
  FOR ds_record IN
    SELECT * FROM daily_stats
  LOOP
    -- Verificar se tem treino completo nessa data
    SELECT EXISTS(
      SELECT 1 FROM workout_tracking
      WHERE aluno_id = ds_record.aluno_id
        AND date = ds_record.date
        AND completed = true
    ) INTO has_workout;

    -- Verificar se tem foto na comunidade nessa data
    SELECT EXISTS(
      SELECT 1 FROM community_posts
      WHERE aluno_id = ds_record.aluno_id
        AND DATE(created_at) = ds_record.date
        AND has_photo = true
    ) INTO has_photo;

    -- Atualizar is_active_day
    UPDATE daily_stats
    SET is_active_day = (has_workout OR has_photo)
    WHERE id = ds_record.id;
  END LOOP;

  RAISE NOTICE 'Recalculação de is_active_day concluída!';
END $$;

-- =====================================================
-- 5. RECALCULAR STREAKS
-- =====================================================

DO $$
DECLARE
  aluno_record RECORD;
  day_record RECORD;
  current_streak_count INT := 0;
  longest_streak_count INT := 0;
  last_date DATE := NULL;
  temp_streak INT := 0;
BEGIN
  FOR aluno_record IN
    SELECT DISTINCT aluno_id FROM daily_stats
  LOOP
    current_streak_count := 0;
    longest_streak_count := 0;
    last_date := NULL;
    temp_streak := 0;

    -- Processar dias ativos em ordem cronológica
    FOR day_record IN
      SELECT date FROM daily_stats
      WHERE aluno_id = aluno_record.aluno_id
        AND is_active_day = TRUE
      ORDER BY date ASC
    LOOP
      -- Se é o primeiro dia ou é consecutivo ao último
      IF last_date IS NULL THEN
        temp_streak := 1;
      ELSIF day_record.date = last_date + INTERVAL '1 day' THEN
        temp_streak := temp_streak + 1;
      ELSE
        -- Streak quebrada, resetar
        temp_streak := 1;
      END IF;

      -- Atualizar recorde se necessário
      IF temp_streak > longest_streak_count THEN
        longest_streak_count := temp_streak;
      END IF;

      last_date := day_record.date;
    END LOOP;

    -- Current streak = streak mais recente (só conta se o último dia ativo foi hoje ou ontem)
    IF last_date IS NOT NULL AND last_date >= CURRENT_DATE - INTERVAL '1 day' THEN
      current_streak_count := temp_streak;
    ELSE
      current_streak_count := 0;
    END IF;

    -- Atualizar user_stats
    UPDATE user_stats
    SET
      current_streak = current_streak_count,
      longest_streak = longest_streak_count,
      last_active_date = last_date,
      total_active_days = (
        SELECT COUNT(*) FROM daily_stats
        WHERE aluno_id = aluno_record.aluno_id AND is_active_day = TRUE
      ),
      updated_at = NOW()
    WHERE aluno_id = aluno_record.aluno_id;
  END LOOP;

  RAISE NOTICE 'Recalculação de streaks concluída!';
END $$;

-- =====================================================
-- 6. VERIFICAR RESULTADOS
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
