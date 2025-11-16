-- ============================================
-- INVESTIGAR SUBSCRIPTION DO ALUNO
-- ============================================
-- Aluno: donnaluisaholding@gmail.com
-- Coach: testecoach@agenciagtx.com.br
-- ============================================

-- 1. Buscar dados do aluno e coach
SELECT
  'ALUNO' as tipo,
  id,
  email,
  full_name
FROM profiles
WHERE email = 'donnaluisaholding@gmail.com'
UNION ALL
SELECT
  'COACH' as tipo,
  id,
  email,
  full_name
FROM profiles
WHERE email = 'testecoach@agenciagtx.com.br';

-- 2. Verificar payment_invitations
SELECT
  'INVITATION' as info,
  *
FROM payment_invitations
WHERE student_email = 'donnaluisaholding@gmail.com'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar subscriptions
SELECT
  'SUBSCRIPTION' as info,
  *
FROM subscriptions
WHERE aluno_id = (
  SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar payments
SELECT
  'PAYMENT' as info,
  *
FROM payments
WHERE aluno_id = (
  SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'
)
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar coach_students
SELECT
  'COACH_STUDENTS' as info,
  cs.*,
  p.email as student_email,
  p.full_name as student_name
FROM coach_students cs
JOIN profiles p ON p.id = cs.student_id
WHERE cs.student_id = (
  SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com'
);
