-- ============================================
-- INVESTIGAR E CORRIGIR ALUNO ESPECÍFICO
-- ============================================
-- Aluno: donnaluisaholding@gmail.com
-- Coach: testecoach@agenciagtx.com.br
-- ============================================

-- 1. Buscar ID do coach
SELECT
  id as coach_id,
  email,
  full_name,
  role
FROM profiles
WHERE email = 'testecoach@agenciagtx.com.br';

-- 2. Buscar dados do aluno
SELECT
  id as student_id,
  email,
  full_name,
  role,
  coach_id,
  first_access_completed
FROM profiles
WHERE email = 'donnaluisaholding@gmail.com';

-- 3. Verificar se existe coach_students
SELECT *
FROM coach_students
WHERE student_id = (
  SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'
);

-- 4. Verificar subscription
SELECT *
FROM subscriptions
WHERE aluno_id = (
  SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'
);

-- ============================================
-- CORREÇÃO
-- ============================================

-- 5. Atualizar first_access_completed do aluno
UPDATE profiles
SET first_access_completed = TRUE
WHERE email = 'donnaluisaholding@gmail.com';

-- 6. Criar coach_students se não existir (ajuste os IDs conforme resultado da query 1 e 2)
-- IMPORTANTE: Execute APENAS se não existir coach_students (query 3 retornar vazio)
INSERT INTO coach_students (coach_id, student_id, status)
SELECT
  (SELECT id FROM profiles WHERE email = 'testecoach@agenciagtx.com.br'),
  (SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'),
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM coach_students
  WHERE student_id = (SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com')
  AND coach_id = (SELECT id FROM profiles WHERE email = 'testecoach@agenciagtx.com.br')
);

-- 7. Verificar resultado final
SELECT
  p.email,
  p.full_name,
  p.first_access_completed,
  p.coach_id,
  coach.email as coach_email,
  cs.status as coach_student_status
FROM profiles p
LEFT JOIN profiles coach ON p.coach_id = coach.id
LEFT JOIN coach_students cs ON cs.student_id = p.id
WHERE p.email = 'donnaluisaholding@gmail.com';
