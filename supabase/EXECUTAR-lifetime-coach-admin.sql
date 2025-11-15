-- ============================================
-- GARANTIR ACESSO VITALÍCIO PARA coach@brutalteam.blog.br
-- ============================================
-- Este coach nunca precisará pagar
-- ============================================

-- Atualizar coach para ter assinatura "ativa" permanentemente
UPDATE profiles
SET
  stripe_subscription_status = 'active',
  subscription_plan = 'empresarial',
  approved = true
WHERE email = 'coach@brutalteam.blog.br'
  AND role = 'coach';

-- Verificar resultado
SELECT
  id,
  full_name,
  email,
  role,
  stripe_subscription_status,
  subscription_plan,
  approved
FROM profiles
WHERE email = 'coach@brutalteam.blog.br';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ACESSO VITALÍCIO CONFIGURADO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Coach: coach@brutalteam.blog.br';
  RAISE NOTICE 'Status: active (vitalício)';
  RAISE NOTICE 'Plano: empresarial';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Este coach nunca será bloqueado';
  RAISE NOTICE '    mesmo sem pagamento no Stripe';
  RAISE NOTICE '';
END $$;
