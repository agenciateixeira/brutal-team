
-- Ajustar assinatura e remover acesso de aluno reembolsado
-- Substitua os marcadores pelos valores corretos antes de executar

WITH target_student AS (
  SELECT id
  FROM profiles
  WHERE email = 'EMAIL_DO_ALUNO_AQUI'
)
UPDATE subscriptions
SET status = 'canceled',
    cancel_at_period_end = FALSE,
    canceled_at = NOW(),
    current_period_end = NOW(),
    cancellation_reason = 'refunded (manual)',
    updated_at = NOW()
WHERE aluno_id = (SELECT id FROM target_student)
  AND status IN ('active', 'trialing', 'past_due');

UPDATE coach_students
SET status = 'inactive',
    updated_at = NOW()
WHERE student_id = (SELECT id FROM target_student);

UPDATE payments
SET status = 'refunded',
    refunded = TRUE,
    refund_amount = amount,
    refunded_at = NOW(),
    updated_at = NOW()
WHERE aluno_id = (SELECT id FROM target_student)
  AND status = 'succeeded';
