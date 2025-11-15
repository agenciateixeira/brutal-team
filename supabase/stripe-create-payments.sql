-- ============================================
-- CRIAR TABELA PAYMENTS
-- ============================================
-- Registra todos os pagamentos de alunos para coaches
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- IDs do Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,

  -- Valores (em centavos para evitar problemas com decimais)
  amount INTEGER NOT NULL, -- valor total cobrado do aluno
  platform_fee INTEGER NOT NULL, -- comissão da plataforma (2%)
  coach_amount INTEGER NOT NULL, -- valor que o coach recebe
  stripe_fee INTEGER, -- taxa da Stripe

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT, -- 'card', 'pix', 'boleto'

  -- Informações adicionais
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Reembolso
  refunded BOOLEAN DEFAULT false,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  CONSTRAINT valid_amounts CHECK (amount > 0 AND platform_fee >= 0 AND coach_amount >= 0),
  CONSTRAINT valid_refund CHECK (refund_amount IS NULL OR refund_amount <= amount)
);

-- Comentários
COMMENT ON TABLE payments IS 'Pagamentos de alunos para coaches';
COMMENT ON COLUMN payments.amount IS 'Valor total em centavos (ex: 30000 = R$ 300,00)';
COMMENT ON COLUMN payments.platform_fee IS 'Comissão da plataforma em centavos (2%)';
COMMENT ON COLUMN payments.coach_amount IS 'Valor do coach em centavos (98%)';
COMMENT ON COLUMN payments.stripe_fee IS 'Taxa da Stripe em centavos';
COMMENT ON COLUMN payments.status IS 'pending, processing, succeeded, failed, refunded, canceled';
COMMENT ON COLUMN payments.payment_method IS 'Método de pagamento usado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_aluno ON payments(aluno_id);
CREATE INDEX IF NOT EXISTS idx_payments_coach ON payments(coach_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge ON payments(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_refunded ON payments(refunded);

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Alunos podem ver seus próprios pagamentos
CREATE POLICY "Alunos can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = aluno_id);

-- Coaches podem ver pagamentos que receberam
CREATE POLICY "Coaches can view their received payments"
  ON payments FOR SELECT
  USING (auth.uid() = coach_id);

-- Apenas sistema pode inserir (via API)
-- CREATE POLICY "System can insert payments"
--   ON payments FOR INSERT
--   WITH CHECK (false); -- Desabilitado por enquanto, apenas via service_role

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Função para calcular estatísticas de pagamentos
CREATE OR REPLACE FUNCTION get_payment_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_received', COALESCE(SUM(coach_amount) FILTER (WHERE status = 'succeeded' AND coach_id = user_id), 0),
    'total_paid', COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded' AND aluno_id = user_id), 0),
    'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    'count_succeeded', COUNT(*) FILTER (WHERE status = 'succeeded'),
    'count_pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'count_failed', COUNT(*) FILTER (WHERE status = 'failed')
  ) INTO result
  FROM payments
  WHERE aluno_id = user_id OR coach_id = user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se funcionou
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
