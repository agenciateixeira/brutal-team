-- ============================================
-- LIMPAR ASSINATURA DA CONTA teste25@teste.com.br
-- ============================================

-- Primeiro, veja o estado atual:
SELECT
  id,
  email,
  full_name,
  role,
  stripe_subscription_id,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE email = 'teste25@teste.com.br';

-- ============================================
-- EXECUTE A LINHA ABAIXO PARA LIMPAR
-- ============================================

UPDATE profiles
SET
  stripe_subscription_id = NULL,
  stripe_subscription_status = NULL,
  subscription_plan = NULL
WHERE email = 'teste25@teste.com.br';

-- Verificar se foi limpo:
SELECT
  email,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE email = 'teste25@teste.com.br';
