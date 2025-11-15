-- ============================================
-- FIX: Comunidade + Dashboard
-- ============================================

-- =====================================================
-- PARTE 1: FIX COMUNIDADE (RLS POLICIES)
-- =====================================================

-- Ver policies atuais que podem estar bloqueando
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members', 'community_posts')
ORDER BY tablename, policyname;

-- Dropar policies problemáticas e recriar super permissivas
-- (para alunos autenticados verem tudo)

-- COMMUNITIES
DROP POLICY IF EXISTS "allow_select_communities" ON communities;
CREATE POLICY "allow_select_communities"
ON communities FOR SELECT
TO authenticated
USING (true);

-- COMMUNITY_MEMBERS
DROP POLICY IF EXISTS "allow_select_members" ON community_members;
CREATE POLICY "allow_select_members"
ON community_members FOR SELECT
TO authenticated
USING (true);

-- COMMUNITY_POSTS
DROP POLICY IF EXISTS "Alunos podem ver posts da comunidade" ON community_posts;
CREATE POLICY "Alunos podem ver posts da comunidade"
ON community_posts FOR SELECT
TO authenticated
USING (true);

-- COMMUNITY_STATS (se existir)
DROP POLICY IF EXISTS "allow_select_community_stats" ON community_stats;
CREATE POLICY "allow_select_community_stats"
ON community_stats FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- PARTE 2: FIX DASHBOARD (FORÇAR ATUALIZAÇÃO)
-- =====================================================

-- Marcar um treino manualmente como teste
-- Substitua o ID pelo seu ID de aluno
DO $$
DECLARE
  test_aluno_id UUID := '501a3efe-84a6-4c71-b135-4c59b41a4e0e'; -- Guilherme
  test_date DATE := CURRENT_DATE;
BEGIN
  -- Criar ou atualizar registro de treino de hoje
  INSERT INTO workout_tracking (
    aluno_id,
    date,
    completed
  )
  VALUES (
    test_aluno_id,
    test_date,
    true
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    completed = true,
    updated_at = NOW();

  RAISE NOTICE 'Treino de teste criado/atualizado!';
END $$;

-- Forçar atualização do trigger manualmente
DO $$
DECLARE
  test_aluno_id UUID := '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
  today_date DATE := CURRENT_DATE;
  total_workouts INT;
  completed_workouts INT;
BEGIN
  -- Contar treinos
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO total_workouts, completed_workouts
  FROM workout_tracking
  WHERE aluno_id = test_aluno_id
    AND date = today_date;

  -- Atualizar daily_stats manualmente
  INSERT INTO daily_stats (
    aluno_id,
    date,
    workouts_planned,
    workouts_completed,
    is_active_day,
    updated_at
  )
  VALUES (
    test_aluno_id,
    today_date,
    total_workouts,
    completed_workouts,
    completed_workouts > 0,
    NOW()
  )
  ON CONFLICT (aluno_id, date)
  DO UPDATE SET
    workouts_planned = total_workouts,
    workouts_completed = completed_workouts,
    is_active_day = completed_workouts > 0,
    updated_at = NOW();

  -- Atualizar user_stats manualmente
  UPDATE user_stats
  SET
    total_workouts = (
      SELECT COUNT(*) FROM workout_tracking
      WHERE aluno_id = test_aluno_id AND completed = true
    ),
    current_streak = CASE
      WHEN last_active_date = today_date - INTERVAL '1 day' THEN current_streak + 1
      ELSE 1
    END,
    longest_streak = CASE
      WHEN last_active_date = today_date - INTERVAL '1 day' AND current_streak + 1 > longest_streak
        THEN current_streak + 1
      WHEN last_active_date != today_date - INTERVAL '1 day' AND 1 > longest_streak
        THEN 1
      ELSE longest_streak
    END,
    last_active_date = today_date,
    total_active_days = total_active_days + 1,
    updated_at = NOW()
  WHERE aluno_id = test_aluno_id;

  RAISE NOTICE 'Stats atualizados manualmente!';
END $$;

-- =====================================================
-- PARTE 3: VERIFICAR RESULTADOS
-- =====================================================

-- 3.1 Ver se treinos estão sendo contados
SELECT
  p.full_name,
  us.current_streak as dias_seguidos,
  us.longest_streak as recorde,
  us.total_workouts as treinos_concluidos,
  us.total_active_days as dias_ativos,
  us.last_active_date as ultimo_dia_ativo
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 3.2 Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.workouts_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- 3.3 Ver se tem registros de workout_tracking
SELECT
  p.full_name,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE completed = true) as completados
FROM workout_tracking wt
JOIN profiles p ON wt.aluno_id = p.id
GROUP BY p.full_name
ORDER BY p.full_name;

-- 3.4 Ver policies finais
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members', 'community_posts', 'community_stats')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
