-- =====================================================
-- TABELA: connected_accounts
-- Descrição: Armazena informações das contas Stripe Connect
-- =====================================================

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_account_id ON connected_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(account_status);

-- Comentários para documentação
COMMENT ON TABLE connected_accounts IS 'Armazena as contas Stripe Connect dos coaches';
COMMENT ON COLUMN connected_accounts.user_id IS 'Referência ao usuário no Supabase Auth';
COMMENT ON COLUMN connected_accounts.stripe_account_id IS 'ID da conta no Stripe Connect';
COMMENT ON COLUMN connected_accounts.charges_enabled IS 'Se a conta pode processar pagamentos';
COMMENT ON COLUMN connected_accounts.payouts_enabled IS 'Se a conta pode receber transferências';
COMMENT ON COLUMN connected_accounts.account_status IS 'Status da conta: pending, active, disabled';
