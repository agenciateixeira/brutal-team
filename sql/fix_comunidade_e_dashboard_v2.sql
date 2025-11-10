-- ============================================
-- FIX: Comunidade + Dashboard (v2)
-- ============================================

-- =====================================================
-- PARTE 1: FIX COMUNIDADE (RLS POLICIES)
-- =====================================================

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

-- =====================================================
-- PARTE 2: VER ESTRUTURA DE workout_tracking
-- =====================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 3: VER REGISTROS DE workout_tracking
-- =====================================================
SELECT * FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
ORDER BY date DESC
LIMIT 10;

-- =====================================================
-- PARTE 4: VERIFICAR RESULTADOS
-- =====================================================

-- 4.1 Ver user_stats
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

-- 4.2 Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.date,
  ds.workouts_planned,
  ds.workouts_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- 4.3 Ver policies de comunidade
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('communities', 'community_members', 'community_posts')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
