-- ============================================
-- DIAGNÓSTICO SIMPLES
-- ============================================

-- 1. Ver estrutura de workout_tracking
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workout_tracking'
ORDER BY ordinal_position;

-- 2. Ver alguns registros de workout_tracking (sem assumir colunas)
SELECT * FROM workout_tracking
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver estrutura de meal_tracking
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'meal_tracking'
ORDER BY ordinal_position;

-- 4. Ver daily_stats de hoje
SELECT
  p.full_name,
  ds.*
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE;

-- 5. Status dos alunos na comunidade
SELECT
  p.id,
  p.full_name,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;
