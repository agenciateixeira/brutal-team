-- ============================================
-- CRIAR TABELA SUBSCRIPTIONS
-- ============================================
-- Assinaturas recorrentes de alunos para coaches
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Valores
  amount INTEGER NOT NULL, -- valor mensal em centavos
  currency TEXT DEFAULT 'brl',
  interval TEXT DEFAULT 'month', -- 'day', 'week', 'month', 'year'

  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Vencimento
  payment_due_day INTEGER NOT NULL,

  -- Trial (período de teste)
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Informações adicionais
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing')),
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_due_day CHECK (payment_due_day >= 1 AND payment_due_day <= 28),
  CONSTRAINT valid_currency CHECK (currency IN ('brl', 'usd')),
  CONSTRAINT valid_interval CHECK (interval IN ('day', 'week', 'month', 'year'))
);

-- Comentários
COMMENT ON TABLE subscriptions IS 'Assinaturas recorrentes de alunos para coaches';
COMMENT ON COLUMN subscriptions.amount IS 'Valor mensal em centavos';
COMMENT ON COLUMN subscriptions.status IS 'active, canceled, past_due, unpaid, incomplete, trialing';
COMMENT ON COLUMN subscriptions.payment_due_day IS 'Dia do mês para cobrança (1-28)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Se deve cancelar no fim do período atual';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Início do período de cobrança atual';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Fim do período de cobrança atual';

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_aluno ON subscriptions(aluno_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach ON subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_at ON subscriptions(cancel_at);

-- Índice composto para buscar assinaturas ativas de um aluno
CREATE INDEX IF NOT EXISTS idx_subscriptions_aluno_status ON subscriptions(aluno_id, status);

-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Alunos podem ver suas próprias assinaturas
CREATE POLICY "Alunos can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = aluno_id);

-- Coaches podem ver assinaturas dos seus alunos
CREATE POLICY "Coaches can view their students subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = coach_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Função para verificar se assinatura está ativa
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

-- Função para obter assinatura ativa do aluno com um coach
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

-- View para assinaturas ativas
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  s.*,
  p_aluno.name as aluno_name,
  p_aluno.email as aluno_email,
  p_coach.name as coach_name,
  p_coach.email as coach_email
FROM subscriptions s
JOIN profiles p_aluno ON s.aluno_id = p_aluno.id
JOIN profiles p_coach ON s.coach_id = p_coach.id
WHERE s.status IN ('active', 'trialing');

-- Verificar se funcionou
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
