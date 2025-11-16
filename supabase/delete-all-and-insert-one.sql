-- ============================================
-- DELETAR TODOS E INSERIR APENAS UM PAGAMENTO
-- ============================================
-- Remove TODOS os pagamentos deste aluno e cria apenas 1 correto
-- ============================================

-- 1. Ver estado atual
SELECT
  'ANTES_DELETAR' as status,
  COUNT(*) as total,
  SUM(coach_amount) as soma_centavos
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';

-- 2. DELETAR TODOS os pagamentos deste aluno
DELETE FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';

-- 3. Confirmar que deletou
SELECT
  'DEPOIS_DELETAR' as status,
  COUNT(*) as total
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';

-- 4. Inserir APENAS 1 pagamento
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
VALUES (
  '27e302bd-1c45-42ed-807d-6094319dfe96',
  '144d9aee-474c-4ddd-b913-b93f5d0b4fd9',
  'manual_initial_payment_sub_1STvEnJt0se8Lm6ooTfBf6Ny',
  'manual_charge_sub_1STvEnJt0se8Lm6ooTfBf6Ny',
  'manual_invoice_sub_1STvEnJt0se8Lm6ooTfBf6Ny',
  500,      -- R$ 5,00
  10,       -- 2% = R$ 0,10
  490,      -- R$ 4,90
  20,       -- Taxa Stripe estimada
  'succeeded',
  'card',
  'Pagamento inicial da assinatura',
  '2025-11-16T01:58:49Z',
  '{"subscription_id": "e8e3cb5a-63da-4e2f-a87a-4bba6da91d15", "stripe_subscription_id": "sub_1STvEnJt0se8Lm6ooTfBf6Ny"}'::jsonb,
  '2025-11-16T01:58:49Z'
);

-- 5. Verificar resultado final
SELECT
  'RESULTADO_FINAL' as status,
  COUNT(*) as total_payments,
  p.id,
  (p.amount / 100.0) as valor_total_reais,
  (p.coach_amount / 100.0) as valor_coach_reais,
  p.paid_at
FROM payments p
WHERE p.aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96'
GROUP BY p.id, p.amount, p.coach_amount, p.paid_at;

-- 6. Total recebido
SELECT
  'TOTAL_RECEBIDO' as tipo,
  COUNT(*) as qtd_pagamentos,
  (SUM(coach_amount) / 100.0) as total_coach_reais
FROM payments
WHERE aluno_id = '27e302bd-1c45-42ed-807d-6094319dfe96';
