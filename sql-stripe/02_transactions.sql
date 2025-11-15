-- =====================================================
-- TABELA: transactions
-- Descrição: Armazena todas as transações de pagamento
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payment_intent_id TEXT UNIQUE,
  connected_account_id TEXT REFERENCES connected_accounts(stripe_account_id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Valor em centavos (ex: R$ 100,00 = 10000)
  fee_amount INTEGER NOT NULL, -- Taxa da plataforma em centavos
  net_amount INTEGER GENERATED ALWAYS AS (amount - fee_amount) STORED, -- Valor líquido calculado automaticamente
  status TEXT NOT NULL DEFAULT 'created', -- created, processing, succeeded, failed, canceled
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB, -- Dados adicionais (plano, período, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_connected_account ON transactions(connected_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_coach ON transactions(coach_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE transactions IS 'Registra todas as transações de pagamento da plataforma';
COMMENT ON COLUMN transactions.stripe_payment_intent_id IS 'ID do PaymentIntent no Stripe';
COMMENT ON COLUMN transactions.connected_account_id IS 'Conta Stripe Connect que recebeu o pagamento';
COMMENT ON COLUMN transactions.amount IS 'Valor total em centavos (ex: R$ 100,00 = 10000)';
COMMENT ON COLUMN transactions.fee_amount IS 'Taxa da plataforma em centavos (2%)';
COMMENT ON COLUMN transactions.net_amount IS 'Valor líquido que o coach recebe (calculado automaticamente)';
COMMENT ON COLUMN transactions.status IS 'Status: created, processing, succeeded, failed, canceled';
COMMENT ON COLUMN transactions.student_id IS 'Aluno que fez o pagamento';
COMMENT ON COLUMN transactions.coach_id IS 'Coach que recebeu o pagamento';
COMMENT ON COLUMN transactions.metadata IS 'Dados extras em JSON (plano escolhido, período, etc.)';
