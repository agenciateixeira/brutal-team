-- ============================================
-- INSERIR SUBSCRIPTION DIRETAMENTE
-- ============================================
-- Dados do Stripe para donnaluisaholding@gmail.com
-- Subscription ID: sub_1STvEnJt0se8Lm6ooTfBf6Ny
-- ============================================

-- Inserir a subscription com os dados exatos do Stripe
INSERT INTO subscriptions (
  aluno_id,
  coach_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  amount,
  currency,
  interval,
  status,
  current_period_start,
  current_period_end,
  payment_due_day,
  cancel_at_period_end,
  created_at,
  updated_at
)
VALUES (
  '27e302bd-1c45-42ed-807d-6094319dfe96',  -- aluno_id (donnaluisaholding@gmail.com)
  '144d9aee-474c-4ddd-b913-b93f5d0b4fd9',  -- coach_id (testecoach@agenciagtx.com.br)
  'sub_1STvEnJt0se8Lm6ooTfBf6Ny',         -- stripe_subscription_id
  'cus_TQmorhTA9GKKAm',                    -- stripe_customer_id
  'price_1STvDqJt0se8Lm6ontSGfgRh',       -- stripe_price_id
  30000,                                   -- amount (R$ 300,00 em centavos)
  'brl',                                   -- currency
  'month',                                 -- interval
  'active',                                -- status
  '2025-11-16T01:58:49Z',                  -- current_period_start (16 nov 01:58)
  '2025-12-16T01:58:49Z',                  -- current_period_end (16 dez 01:58)
  16,                                      -- payment_due_day
  FALSE,                                   -- cancel_at_period_end
  '2025-11-16T01:58:49Z',                  -- created_at
  NOW()                                    -- updated_at
)
ON CONFLICT (stripe_subscription_id)
DO UPDATE SET
  status = EXCLUDED.status,
  amount = EXCLUDED.amount,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- Verificar se foi inserido corretamente
SELECT
  'SUBSCRIPTION_CRIADA' as status,
  s.id,
  s.stripe_subscription_id,
  s.status,
  s.amount,
  s.current_period_start,
  s.current_period_end,
  p.email as aluno_email,
  p.full_name as aluno_nome,
  c.email as coach_email,
  c.full_name as coach_nome
FROM subscriptions s
JOIN profiles p ON p.id = s.aluno_id
JOIN profiles c ON c.id = s.coach_id
WHERE s.stripe_subscription_id = 'sub_1STvEnJt0se8Lm6ooTfBf6Ny';
