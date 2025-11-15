-- =====================================================
-- ATUALIZAÇÃO: profiles
-- Descrição: Adiciona colunas relacionadas ao Stripe
-- =====================================================

-- Adicionar colunas do Stripe Connect na tabela profiles (se ainda não existem)
DO $$
BEGIN
  -- stripe_account_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT UNIQUE;
  END IF;

  -- stripe_account_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_account_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_account_status TEXT DEFAULT 'pending';
  END IF;

  -- stripe_charges_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  -- stripe_payouts_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  -- stripe_customer_id (para alunos que fazem pagamentos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- stripe_subscription_id (para coaches que pagam assinatura)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- stripe_subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_status TEXT;
  END IF;
END $$;

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_status ON profiles(stripe_subscription_status);

-- Comentários para documentação
COMMENT ON COLUMN profiles.stripe_account_id IS 'ID da conta Stripe Connect (para coaches)';
COMMENT ON COLUMN profiles.stripe_account_status IS 'Status da conta Stripe Connect: pending, active, disabled';
COMMENT ON COLUMN profiles.stripe_charges_enabled IS 'Se pode processar pagamentos (KYC completo)';
COMMENT ON COLUMN profiles.stripe_payouts_enabled IS 'Se pode receber transferências (dados bancários configurados)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do Customer no Stripe (para alunos que pagam)';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'ID da assinatura no Stripe (para coaches)';
COMMENT ON COLUMN profiles.stripe_subscription_status IS 'Status da assinatura: active, trialing, canceled, etc.';
