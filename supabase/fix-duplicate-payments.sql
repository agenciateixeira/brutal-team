-- ============================================
-- CORRIGIR PAGAMENTOS DUPLICADOS
-- ============================================
-- Remove todos os pagamentos manuais e cria apenas UM correto
-- ============================================

-- 1. Ver quantos payments existem agora
SELECT
  'PAYMENTS_ANTES_DA_LIMPEZA' as status,
  COUNT(*) as total_payments,
  SUM(coach_amount) as total_coach_centavos,
  (SUM(coach_amount) / 100.0) as total_coach_reais
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';

-- 2. DELETAR todos os pagamentos manuais duplicados
DELETE FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
AND stripe_invoice_id LIKE 'manual_invoice_%';

-- 3. Inserir APENAS UM pagamento correto
INSERT INTO payments (
  aluno_id,
  coach_id,
  stripe_payment_intent_id,
  stripe_charge_id,
  stripe_invoice_id,
  amount,
  platform_fee,
  coach_amount,
  stripe_fee,
  status,
  payment_method,
  description,
  paid_at,
  metadata,
  created_at
)
SELECT
  '27e302bd-1c45-42ed-807d-6094319dfe96',
  '144d9aee-474c-4ddd-b913-b93f5d0b4fd9',
  'manual_initial_payment_' || s.stripe_subscription_id,
  'manual_charge_' || s.stripe_subscription_id,
  'manual_invoice_' || s.stripe_subscription_id,
  s.amount,
  ROUND(s.amount * 0.02),
  s.amount - ROUND(s.amount * 0.02),
  ROUND(s.amount * 0.04),
  'succeeded',
  'card',
  'Pagamento inicial da assinatura',
  s.current_period_start,
  jsonb_build_object(
    'subscription_id', s.id,
    'stripe_subscription_id', s.stripe_subscription_id
  ),
  s.current_period_start
FROM subscriptions s
WHERE s.stripe_subscription_id = 'sub_1STvEnJt0se8Lm6ooTfBf6Ny';

-- 4. Verificar resultado final
SELECT
  'PAYMENT_FINAL' as status,
  p.id,
  p.amount as amount_centavos,
  (p.amount / 100.0) as amount_reais,
  p.coach_amount as coach_amount_centavos,
  (p.coach_amount / 100.0) as coach_amount_reais,
  p.platform_fee as platform_fee_centavos,
  (p.platform_fee / 100.0) as platform_fee_reais,
  p.status,
  p.paid_at,
  aluno.email as aluno_email
FROM payments p
JOIN profiles aluno ON aluno.id = p.aluno_id
WHERE p.aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
ORDER BY p.paid_at DESC;

-- 5. Total recebido (deve ser R$ 4,90)
SELECT
  'TOTAL_RECEBIDO_CORRETO' as status,
  COUNT(*) as total_payments,
  (SUM(coach_amount) / 100.0) as total_coach_reais
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
AND status = 'succeeded';
