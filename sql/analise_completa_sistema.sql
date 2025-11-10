-- ============================================
-- ANÁLISE COMPLETA DO SISTEMA
-- ============================================

-- ===== PARTE 1: COMUNIDADE =====

-- 1.1 Ver TODOS os alunos e se estão na comunidade
SELECT
  p.id,
  p.full_name,
  p.email,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅' ELSE '❌' END as na_comunidade,
  cm.community_id,
  cm.joined_at
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 1.2 Ver se a comunidade pública existe
SELECT * FROM communities
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 1.3 Ver policies de RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, cmd;

-- ===== PARTE 2: GAMIFICAÇÃO =====

-- 2.1 Ver triggers ativos
SELECT
  event_object_table as tabela,
  trigger_name,
  event_manipulation as evento,
  action_timing as quando,
  action_statement as funcao
FROM information_schema.triggers
WHERE event_object_table IN ('meal_tracking', 'workout_tracking', 'community_posts')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2.2 Ver estrutura das tabelas de tracking
SELECT
  'workout_tracking' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2.3 Ver dados de workout_tracking de hoje
SELECT
  p.full_name,
  wt.*
FROM workout_tracking wt
JOIN profiles p ON wt.aluno_id = p.id
WHERE wt.date = CURRENT_DATE
ORDER BY p.full_name;

-- 2.4 Ver dados de meal_tracking de hoje
SELECT
  p.full_name,
  mt.*
FROM meal_tracking mt
JOIN profiles p ON mt.aluno_id = p.id
WHERE mt.date = CURRENT_DATE
ORDER BY p.full_name;

-- 2.5 Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.*
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- 2.6 Ver user_stats
SELECT
  p.full_name,
  us.current_streak,
  us.longest_streak,
  us.total_workouts,
  us.total_meals_completed,
  us.total_active_days,
  us.last_active_date,
  us.updated_at
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- ===== PARTE 3: TESTES =====

-- 3.1 Testar trigger manualmente (force update)
DO $$
DECLARE
  test_id UUID := '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
BEGIN
  -- Forçar trigger de meal_tracking
  UPDATE meal_tracking
  SET updated_at = NOW()
  WHERE aluno_id = test_id
    AND date = CURRENT_DATE;

  -- Forçar trigger de workout_tracking
  UPDATE workout_tracking
  SET updated_at = NOW()
  WHERE aluno_id = test_id
    AND date = CURRENT_DATE;

  RAISE NOTICE 'Triggers forçados!';
END $$;

-- 3.2 Ver daily_stats DEPOIS do trigger forçado
SELECT
  p.full_name,
  ds.date,
  ds.workouts_completed,
  ds.meals_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
  AND p.id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
