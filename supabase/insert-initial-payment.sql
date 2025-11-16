-- ============================================
-- INSERIR PAGAMENTO INICIAL
-- ============================================
-- Quando o aluno paga a primeira vez, o webhook deve criar
-- um registro na tabela payments. Se o webhook falhou,
-- este SQL cria manualmente.
-- ============================================

-- 1. Verificar se já existe payment para este aluno
SELECT
  'PAYMENTS_EXISTENTES' as check_type,
  COUNT(*) as total_payments,
  COALESCE(SUM(coach_amount), 0) as total_recebido
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';

-- 2. Inserir o pagamento inicial (R$ 5,00)
-- Valores calculados automaticamente: 2% de taxa de plataforma
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
  '27e302bd-1c45-42ed-807d-6094319dfe96',                    -- aluno_id
  '144d9aee-474c-4ddd-b913-b93f5d0b4fd9',                    -- coach_id
  'manual_initial_payment_' || s.stripe_subscription_id,     -- stripe_payment_intent_id (manual)
  'manual_charge_' || s.stripe_subscription_id,              -- stripe_charge_id (manual)
  'manual_invoice_' || s.stripe_subscription_id,             -- stripe_invoice_id (manual)
  s.amount,                                                   -- amount: R$ 5,00 (500 centavos)
  ROUND(s.amount * 0.02),                                    -- platform_fee: 2% = R$ 0,10 (10 centavos)
  s.amount - ROUND(s.amount * 0.02),                         -- coach_amount: R$ 4,90 (490 centavos)
  ROUND(s.amount * 0.04),                                    -- stripe_fee: ~4% estimado
  'succeeded',                                                -- status
  'card',                                                     -- payment_method
  'Pagamento inicial da assinatura (criado manualmente)',    -- description
  s.current_period_start,                                    -- paid_at (data do início da subscription)
  jsonb_build_object(
    'subscription_id', s.id,
    'stripe_subscription_id', s.stripe_subscription_id,
    'note', 'Payment criado manualmente pois webhook falhou'
  ),
  s.current_period_start                                     -- created_at
FROM subscriptions s
WHERE s.stripe_subscription_id = 'sub_1STvEnJt0se8Lm6ooTfBf6Ny'
AND NOT EXISTS (
  SELECT 1 FROM payments p
  WHERE p.aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
  AND p.stripe_invoice_id LIKE 'manual_invoice_%'
);

-- 3. Verificar o resultado
SELECT
  'PAYMENT_CRIADO' as status,
  p.id,
  p.amount as amount_centavos,
  (p.amount / 100.0) as amount_reais,
  p.coach_amount as coach_amount_centavos,
  (p.coach_amount / 100.0) as coach_amount_reais,
  p.platform_fee as platform_fee_centavos,
  (p.platform_fee / 100.0) as platform_fee_reais,
  p.status,
  p.paid_at,
  aluno.email as aluno_email,
  coach.email as coach_email
FROM payments p
JOIN profiles aluno ON aluno.id = p.aluno_id
JOIN profiles coach ON coach.id = p.coach_id
WHERE p.aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
ORDER BY p.paid_at DESC;

-- 4. Verificar total recebido
SELECT
  'TOTAL_RECEBIDO' as tipo,
  COUNT(*) as total_pagamentos,
  SUM(amount) as total_bruto_centavos,
  SUM(coach_amount) as total_coach_centavos,
  (SUM(coach_amount) / 100.0) as total_coach_reais
FROM payments
WHERE coach_id = '144d9aee-474c-4ddd-b913-b93f5d0b4fd9'
AND status = 'succeeded';
