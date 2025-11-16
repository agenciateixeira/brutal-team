-- ============================================
-- CORRIGIR VALOR DA SUBSCRIPTION
-- ============================================
-- O aluno pagou R$ 5,00, não R$ 300,00
-- Corrigir o valor para 500 centavos
-- ============================================

-- Atualizar o valor da subscription
UPDATE subscriptions
SET
  amount = 500,  -- R$ 5,00 em centavos
  updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1STvEnJt0se8Lm6ooTfBf6Ny';

-- Verificar se foi atualizado
SELECT
  'SUBSCRIPTION_ATUALIZADA' as status,
  s.id,
  s.stripe_subscription_id,
  s.status,
  s.amount as amount_centavos,
  (s.amount / 100.0) as amount_reais,
  s.current_period_start,
  s.current_period_end,
  p.email as aluno_email,
  c.email as coach_email
FROM subscriptions s
JOIN profiles p ON p.id = s.aluno_id
JOIN profiles c ON c.id = s.coach_id
WHERE s.stripe_subscription_id = 'sub_1STvEnJt0se8Lm6ooTfBf6Ny';
