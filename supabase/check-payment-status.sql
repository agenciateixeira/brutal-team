-- ============================================
-- VERIFICAR STATUS DO PAGAMENTO E SUBSCRIPTION
-- ============================================
-- Aluno: donnaluisaholding@gmail.com
-- ============================================

-- 1. Verificar convite e status
SELECT
  'INVITATION_STATUS' as check_type,
  status,
  amount,
  created_at,
  completed_at,
  student_id,
  coach_id
FROM payment_invitations
WHERE student_email = 'donnaluisaholding@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verificar se existe subscription
SELECT
  'SUBSCRIPTION_EXISTS' as check_type,
  COUNT(*) as count,
  string_agg(stripe_subscription_id, ', ') as stripe_ids,
  string_agg(status, ', ') as statuses
FROM subscriptions
WHERE aluno_id = (SELECT id FROM profiles WHERE email = 'donnaluisaholding@gmail.com');

-- 3. Verificar dados completos do aluno
SELECT
  'STUDENT_FULL_INFO' as check_type,
  p.id as student_id,
  p.email,
  p.full_name,
  p.coach_id,
  c.email as coach_email,
  cs.status as coach_student_status,
  p.first_access_completed
FROM profiles p
LEFT JOIN profiles c ON c.id = p.coach_id
LEFT JOIN coach_students cs ON cs.student_id = p.id
WHERE p.email = 'donnaluisaholding@gmail.com';
