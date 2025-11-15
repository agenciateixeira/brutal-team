-- ============================================
-- LIMPAR ASSINATURA CRIADA INCORRETAMENTE COM BOLETO
-- ============================================

-- Ver qual email você usou para cadastrar
SELECT
  id,
  email,
  full_name,
  role,
  stripe_subscription_id,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE role = 'coach'
ORDER BY created_at DESC;

-- ============================================
-- EXECUTE A LINHA ABAIXO SUBSTITUINDO O EMAIL
-- ============================================

-- Descomente e substitua o email:
/*
UPDATE profiles
SET
  stripe_subscription_id = NULL,
  stripe_subscription_status = NULL,
  subscription_plan = NULL
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
*/

-- Verificar se limpou
SELECT
  email,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
