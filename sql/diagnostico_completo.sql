-- ============================================
-- DIAGNÓSTICO COMPLETO
-- ============================================

-- 1. Verificar se tem treinos marcados como completo
SELECT
  p.full_name,
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE completed = true) as treinos_completos
FROM workout_tracking wt
JOIN profiles p ON wt.aluno_id = p.id
GROUP BY p.full_name
ORDER BY p.full_name;

-- 2. Ver exemplos de workout_tracking
SELECT
  p.full_name,
  wt.date,
  wt.period,
  wt.completed,
  wt.created_at
FROM workout_tracking wt
JOIN profiles p ON wt.aluno_id = p.id
ORDER BY wt.created_at DESC
LIMIT 10;

-- 3. Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.date,
  ds.workouts_planned,
  ds.workouts_completed,
  ds.meals_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY ds.updated_at DESC;

-- 4. Ver todos os alunos e membros da comunidade
SELECT
  p.id,
  p.full_name,
  p.email,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 5. Contar membros na comunidade pública
SELECT
  COUNT(*) as total_membros
FROM community_members
WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- 6. Ver triggers ativos
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('workout_tracking', 'meal_tracking', 'community_posts')
ORDER BY event_object_table, trigger_name;
