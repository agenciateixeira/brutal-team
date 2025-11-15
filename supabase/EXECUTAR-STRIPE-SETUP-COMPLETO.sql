-- ============================================
-- STRIPE CONNECT - SETUP COMPLETO
-- ============================================
-- Este arquivo executa TODOS os scripts necessários para configurar
-- o sistema de pagamentos com Stripe Connect no Supabase
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Ele vai criar todas as tabelas e campos necessários
--
-- Ordem de execução:
-- 1. Adicionar campos Stripe na tabela profiles
-- 2. Criar tabela invite_tokens
-- 3. Criar tabela payments
-- 4. Criar tabela subscriptions
-- ============================================

-- ============================================
-- 1. ADICIONAR CAMPOS STRIPE NA TABELA PROFILES
-- ============================================

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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(stripe_subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan);

-- ============================================
-- 2. CRIAR TABELA INVITE_TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aluno_email TEXT,
  aluno_name TEXT,
  payment_due_day INTEGER NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_due_day CHECK (payment_due_day >= 1 AND payment_due_day <= 28)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_coach ON invite_tokens(coach_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_used ON invite_tokens(used);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires ON invite_tokens(expires_at);

-- RLS
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their own invites" ON invite_tokens;
CREATE POLICY "Coaches can view their own invites"
  ON invite_tokens FOR SELECT
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can create invites" ON invite_tokens;
CREATE POLICY "Coaches can create invites"
  ON invite_tokens FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Anyone can view valid invites" ON invite_tokens;
CREATE POLICY "Anyone can view valid invites"
  ON invite_tokens FOR SELECT
  USING (used = false AND expires_at > NOW());

-- ============================================
-- 3. CRIAR TABELA PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  coach_amount INTEGER NOT NULL,
  stripe_fee INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  refunded BOOLEAN DEFAULT false,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  CONSTRAINT valid_amounts CHECK (amount > 0 AND platform_fee >= 0 AND coach_amount >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_aluno ON payments(aluno_id);
CREATE INDEX IF NOT EXISTS idx_payments_coach ON payments(coach_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos can view their own payments" ON payments;
CREATE POLICY "Alunos can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Coaches can view their received payments" ON payments;
CREATE POLICY "Coaches can view their received payments"
  ON payments FOR SELECT
  USING (auth.uid() = coach_id);

-- ============================================
-- 4. CRIAR TABELA SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'brl',
  interval TEXT DEFAULT 'month',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  payment_due_day INTEGER NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing')),
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_due_day CHECK (payment_due_day >= 1 AND payment_due_day <= 28)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_aluno ON subscriptions(aluno_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach ON subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_aluno_status ON subscriptions(aluno_id, status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos can view their own subscriptions" ON subscriptions;
CREATE POLICY "Alunos can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Coaches can view their students subscriptions" ON subscriptions;
CREATE POLICY "Coaches can view their students subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = coach_id);

-- ============================================
-- 5. TRIGGERS E FUNÇÕES
-- ============================================

-- Trigger para invite_tokens
CREATE OR REPLACE FUNCTION update_invite_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invite_tokens_updated_at ON invite_tokens;
CREATE TRIGGER trigger_update_invite_tokens_updated_at
  BEFORE UPDATE ON invite_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_invite_tokens_updated_at();

-- Trigger para payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payments_updated_at ON payments;
CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Trigger para subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================

-- Verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(sub_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status TEXT;
BEGIN
  SELECT status INTO sub_status
  FROM subscriptions
  WHERE id = sub_id;

  RETURN sub_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- Obter assinatura ativa do aluno com um coach
CREATE OR REPLACE FUNCTION get_active_subscription(p_aluno_id UUID, p_coach_id UUID)
RETURNS UUID AS $$
DECLARE
  sub_id UUID;
BEGIN
  SELECT id INTO sub_id
  FROM subscriptions
  WHERE aluno_id = p_aluno_id
    AND coach_id = p_coach_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN sub_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar tabelas criadas
SELECT
  'profiles - campos Stripe' as item,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name LIKE 'stripe%'

UNION ALL

SELECT
  'invite_tokens' as item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'invite_tokens'

UNION ALL

SELECT
  'payments' as item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'payments'

UNION ALL

SELECT
  'subscriptions' as item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'subscriptions';

-- ============================================
-- SUCESSO! ✅
-- ============================================
-- Todas as tabelas e campos foram criados.
-- Próximos passos:
-- 1. Instalar dependências: npm install stripe @stripe/stripe-js @stripe/react-stripe-js
-- 2. Adicionar variáveis de ambiente no .env.local
-- 3. Criar rotas da API
-- 4. Criar telas de cadastro e pagamento
-- ============================================
