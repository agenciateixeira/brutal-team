-- ============================================
-- FIX FINAL: Constraint + Comunidade
-- ============================================

-- PASSO 1: Adicionar UNIQUE constraint em workout_tracking
-- Primeiro, remover duplicatas se existirem
DELETE FROM workout_tracking a
USING workout_tracking b
WHERE a.id > b.id
  AND a.aluno_id = b.aluno_id
  AND a.date = b.date;

-- Adicionar constraint
ALTER TABLE workout_tracking
ADD CONSTRAINT workout_tracking_aluno_date_unique
UNIQUE (aluno_id, date);

-- PASSO 2: Ver daily_stats de HOJE
SELECT
  p.full_name,
  ds.workouts_planned,
  ds.workouts_completed,
  ds.meals_planned,
  ds.meals_completed,
  ds.is_active_day,
  ds.updated_at
FROM daily_stats ds
JOIN profiles p ON ds.aluno_id = p.id
WHERE ds.date = CURRENT_DATE
ORDER BY p.full_name;

-- PASSO 3: Ver user_stats de todos
SELECT
  p.full_name,
  us.current_streak as dias_seguidos,
  us.longest_streak as recorde,
  us.total_workouts as treinos,
  us.total_meals_completed as refeicoes,
  us.total_active_days as dias_ativos
FROM user_stats us
JOIN profiles p ON us.aluno_id = p.id
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- PASSO 4: Ver se TODOS estão na comunidade
SELECT
  p.id,
  p.full_name,
  CASE WHEN cm.aluno_id IS NOT NULL THEN '✅ NA COMUNIDADE' ELSE '❌ FORA' END as status
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- PASSO 5: Adicionar quem estiver fora
INSERT INTO community_members (community_id, aluno_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  p.id,
  'member'
FROM profiles p
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
  AND cm.aluno_id IS NULL
ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- PASSO 6: Verificar RLS policies (podem estar bloqueando)
SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'TEM FILTRO' ELSE 'SEM FILTRO' END as tem_restricao
FROM pg_policies
WHERE tablename IN ('communities', 'community_members', 'community_posts')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- PASSO 7: Testar query que a aplicação usa
-- (simula o que acontece quando aluno acessa a página)
SELECT
  cm.community_id,
  c.name,
  c.type
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
WHERE cm.aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e';
