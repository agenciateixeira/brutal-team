-- ============================================
-- ADICIONAR CAMPOS STRIPE NA TABELA PROFILES
-- ============================================
-- Este script adiciona os campos necessários para integração com Stripe Connect
-- Execute este script no SQL Editor do Supabase

-- Adicionar campos Stripe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_created';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_due_day INTEGER;

-- Adicionar comentários
COMMENT ON COLUMN profiles.stripe_account_id IS 'ID da conta Stripe Connect (para coaches)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do customer Stripe (para alunos e coaches)';
COMMENT ON COLUMN profiles.stripe_account_status IS 'Status da conta Connect: not_created, pending, active, restricted';
COMMENT ON COLUMN profiles.stripe_charges_enabled IS 'Se a conta pode receber pagamentos';
COMMENT ON COLUMN profiles.stripe_payouts_enabled IS 'Se a conta pode fazer saques';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'ID da assinatura do coach na plataforma';
COMMENT ON COLUMN profiles.stripe_subscription_status IS 'Status da assinatura: active, canceled, past_due, unpaid';
COMMENT ON COLUMN profiles.subscription_plan IS 'Plano do coach: basic, pro, premium';
COMMENT ON COLUMN profiles.payment_due_day IS 'Dia do vencimento do pagamento (1-28)';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(stripe_subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- Constraint para validar dia de vencimento
ALTER TABLE profiles
ADD CONSTRAINT valid_payment_due_day
CHECK (payment_due_day IS NULL OR (payment_due_day >= 1 AND payment_due_day <= 28));

-- Constraint para validar status da conta
ALTER TABLE profiles
ADD CONSTRAINT valid_stripe_account_status
CHECK (stripe_account_status IN ('not_created', 'pending', 'active', 'restricted'));

-- Constraint para validar status da assinatura
ALTER TABLE profiles
ADD CONSTRAINT valid_subscription_status
CHECK (stripe_subscription_status IS NULL OR stripe_subscription_status IN ('active', 'canceled', 'past_due', 'unpaid'));

-- Constraint para validar plano
ALTER TABLE profiles
ADD CONSTRAINT valid_subscription_plan
CHECK (subscription_plan IS NULL OR subscription_plan IN ('basic', 'pro', 'premium'));

-- Verificar se funcionou
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE 'stripe%' OR column_name LIKE '%subscription%' OR column_name = 'payment_due_day'
ORDER BY ordinal_position;
