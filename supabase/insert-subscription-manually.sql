-- ============================================
-- INSERIR SUBSCRIPTION MANUALMENTE
-- ============================================
-- Quando o webhook falha e a subscription não é criada automaticamente
-- Use este SQL para criar manualmente baseado nos dados do Stripe
-- ============================================

-- PASSO 1: Buscar IDs necessários
SELECT
  'STUDENT_INFO' as tipo,
  id as student_id,
  email,
  full_name,
  coach_id
FROM profiles
WHERE email = 'donnaluisaholding@gmail.com';

SELECT
  'COACH_INFO' as tipo,
  id as coach_id,
  email,
  full_name
FROM profiles
WHERE email = 'testecoach@agenciagtx.com.br';

-- PASSO 2: Inserir subscription manualmente
-- IMPORTANTE: Substitua os valores abaixo pelos valores REAIS do Stripe!
-- Você pode encontrar esses dados em: https://dashboard.stripe.com/subscriptions

-- Exemplo de INSERT (AJUSTE OS VALORES):
/*
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
  '27e302bd-1c45-42ed-807d-6094319dfe96', -- student_id (do PASSO 1)
  '144d9aee-474c-4ddd-b913-b93f5d0b4fd9', -- coach_id (do PASSO 1)
  'sub_1STPe7FMnw8AtxwInkT9S7gH',        -- stripe_subscription_id (do Stripe)
  'cus_XXXXXXXXX',                        -- stripe_customer_id (do Stripe)
  'price_XXXXXXXXX',                      -- stripe_price_id (do Stripe)
  30000,                                  -- amount em centavos (R$ 300,00 = 30000)
  'brl',                                  -- currency
  'month',                                -- interval
  'active',                               -- status
  NOW() - INTERVAL '1 day',               -- current_period_start
  NOW() + INTERVAL '29 days',             -- current_period_end (30 dias total)
  EXTRACT(DAY FROM NOW() + INTERVAL '29 days')::INTEGER, -- payment_due_day
  FALSE,                                  -- cancel_at_period_end
  NOW(),                                  -- created_at
  NOW()                                   -- updated_at
)
ON CONFLICT (stripe_subscription_id) DO NOTHING;
*/

-- PASSO 3: Verificar se foi inserido
SELECT
  'SUBSCRIPTION_INSERTED' as check,
  s.id,
  s.stripe_subscription_id,
  s.status,
  s.amount,
  s.current_period_end,
  p.email as aluno_email,
  c.email as coach_email
FROM subscriptions s
JOIN profiles p ON p.id = s.aluno_id
JOIN profiles c ON c.id = s.coach_id
WHERE s.stripe_subscription_id = 'sub_1STPe7FMnw8AtxwInkT9S7gH';
