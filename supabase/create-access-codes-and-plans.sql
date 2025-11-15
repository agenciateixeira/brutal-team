-- ============================================
-- SISTEMA DE CÓDIGOS DE ACESSO E PLANOS
-- ============================================

-- ENUM para tipos de planos
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('mensal', 'semestral', 'anual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de códigos de acesso únicos
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  code VARCHAR(20) UNIQUE NOT NULL, -- Código único gerado

  -- Status
  is_active BOOLEAN DEFAULT FALSE, -- Ativado após pagamento
  is_used BOOLEAN DEFAULT FALSE, -- Usado no primeiro login
  used_at TIMESTAMP WITH TIME ZONE,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos e pagamentos
CREATE TABLE IF NOT EXISTS student_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tipo de plano
  plan_type plan_type NOT NULL,

  -- Valores
  monthly_value DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,

  -- Datas
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  next_due_date DATE,
  end_date DATE, -- Para planos semestrais/anuais

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES profiles(id), -- Admin que confirmou

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar código de acesso único
CREATE OR REPLACE FUNCTION generate_unique_access_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 8 caracteres (letras maiúsculas e números)
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM access_codes WHERE code = new_code) INTO code_exists;

    -- Se não existir, retornar
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar código de acesso automaticamente ao aprovar aluno
CREATE OR REPLACE FUNCTION create_access_code_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se aluno foi aprovado e não tem código ainda
  IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
    INSERT INTO access_codes (aluno_id, code)
    VALUES (NEW.id, generate_unique_access_code())
    ON CONFLICT (aluno_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_access_code ON profiles;

CREATE TRIGGER trigger_create_access_code
  AFTER UPDATE OF approved ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'aluno')
  EXECUTE FUNCTION create_access_code_on_approval();

-- Índices
CREATE INDEX idx_access_codes_aluno ON access_codes(aluno_id);
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_active ON access_codes(is_active);

CREATE INDEX idx_plans_aluno ON student_plans(aluno_id);
CREATE INDEX idx_plans_active ON student_plans(is_active);
CREATE INDEX idx_plans_type ON student_plans(plan_type);

-- RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;

-- Access Codes Policies
CREATE POLICY "Alunos podem ver seu próprio código"
  ON access_codes FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Coaches e admins podem ver todos os códigos"
  ON access_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Admins podem gerenciar códigos"
  ON access_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Student Plans Policies
CREATE POLICY "Alunos podem ver seu próprio plano"
  ON student_plans FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Coaches e admins podem ver todos os planos"
  ON student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Admins e coaches podem gerenciar planos"
  ON student_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_access_codes_updated_at
  BEFORE UPDATE ON access_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_plans_updated_at
  BEFORE UPDATE ON student_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Sistema de códigos e planos criado!
