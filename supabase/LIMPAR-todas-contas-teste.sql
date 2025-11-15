-- ============================================
-- LIMPAR TODAS AS CONTAS DE TESTE
-- (Mantém apenas o admin coach@brutalteam.blog.br intacto)
-- ============================================

-- Primeiro, veja quais contas serão afetadas:
SELECT
  id,
  email,
  full_name,
  role,
  stripe_subscription_id,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE
  email LIKE '%@teste%'
  AND email != 'coach@brutalteam.blog.br'
ORDER BY email;

-- ============================================
-- CUIDADO: Isso vai limpar TODAS as contas de teste
-- EXECUTE A LINHA ABAIXO PARA LIMPAR
-- ============================================

UPDATE profiles
SET
  stripe_subscription_id = NULL,
  stripe_subscription_status = NULL,
  subscription_plan = NULL
WHERE
  email LIKE '%@teste%'
  AND email != 'coach@brutalteam.blog.br';

-- Verificar contas limpas:
SELECT
  email,
  stripe_subscription_status,
  subscription_plan
FROM profiles
WHERE email LIKE '%@teste%'
ORDER BY email;
