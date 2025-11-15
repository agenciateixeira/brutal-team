-- Adicionar campos de pagamento na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS payment_due_date DATE,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2) DEFAULT 0.00;

-- Criar enum para status de pagamento (opcional, mas recomendado)
DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('active', 'pending', 'overdue', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50),
  reference_month VARCHAR(7) NOT NULL, -- formato: YYYY-MM
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_history_aluno ON payment_history(aluno_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_month ON payment_history(reference_month);

-- RLS Policies para payment_history

-- Habilitar RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Coach pode ver todos os pagamentos
DROP POLICY IF EXISTS "Coach pode ver todos os pagamentos" ON payment_history;
CREATE POLICY "Coach pode ver todos os pagamentos"
ON payment_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- Coach pode inserir pagamentos
DROP POLICY IF EXISTS "Coach pode inserir pagamentos" ON payment_history;
CREATE POLICY "Coach pode inserir pagamentos"
ON payment_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- Coach pode atualizar pagamentos
DROP POLICY IF EXISTS "Coach pode atualizar pagamentos" ON payment_history;
CREATE POLICY "Coach pode atualizar pagamentos"
ON payment_history FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- Alunos podem ver apenas seus próprios pagamentos
DROP POLICY IF EXISTS "Alunos podem ver seus pagamentos" ON payment_history;
CREATE POLICY "Alunos podem ver seus pagamentos"
ON payment_history FOR SELECT
TO authenticated
USING (aluno_id = auth.uid());

-- Comentários nas tabelas
COMMENT ON COLUMN profiles.payment_status IS 'Status do pagamento: active, pending, overdue, suspended';
COMMENT ON COLUMN profiles.payment_due_date IS 'Data de vencimento do pagamento mensal';
COMMENT ON COLUMN profiles.monthly_fee IS 'Valor mensal da consultoria';
COMMENT ON TABLE payment_history IS 'Histórico de pagamentos dos alunos';
