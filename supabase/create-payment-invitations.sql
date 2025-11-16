-- ============================================
-- CRIAR SISTEMA DE CONVITES DE PAGAMENTO
-- ============================================
-- Permite que coaches enviem links de cobrança para alunos que ainda não têm conta
-- O aluno clica no link, completa o cadastro e faz o pagamento

-- Tabela de convites de pagamento
CREATE TABLE IF NOT EXISTS payment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Dados do aluno (ainda não cadastrado)
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,

  -- Dados da cobrança
  amount INTEGER NOT NULL, -- em centavos
  interval TEXT NOT NULL DEFAULT 'month', -- month, week, year
  due_day INTEGER, -- dia do vencimento (1-28)
  trial_days INTEGER DEFAULT 0,
  description TEXT,

  -- Token único para o link
  token TEXT NOT NULL UNIQUE,

  -- Status do convite
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired, canceled

  -- Subscription criada quando aluno finaliza
  subscription_id UUID REFERENCES subscriptions(id),
  student_id UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- convite expira após X dias
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_invitations_coach ON payment_invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_payment_invitations_token ON payment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_payment_invitations_email ON payment_invitations(student_email);
CREATE INDEX IF NOT EXISTS idx_payment_invitations_status ON payment_invitations(status);

-- Constraints
ALTER TABLE payment_invitations
ADD CONSTRAINT valid_invitation_status
CHECK (status IN ('pending', 'completed', 'expired', 'canceled'));

ALTER TABLE payment_invitations
ADD CONSTRAINT valid_invitation_interval
CHECK (interval IN ('month', 'week', 'year'));

ALTER TABLE payment_invitations
ADD CONSTRAINT valid_due_day
CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 28));

ALTER TABLE payment_invitations
ADD CONSTRAINT valid_amount
CHECK (amount >= 500); -- Mínimo R$ 5,00

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar token automaticamente
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;

  -- Definir data de expiração (7 dias por padrão)
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invitation_token
BEFORE INSERT ON payment_invitations
FOR EACH ROW
EXECUTE FUNCTION set_invitation_token();

-- Função para expirar convites antigos
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE payment_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE payment_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Coach pode ver seus próprios convites
CREATE POLICY "Coaches can view their own invitations"
ON payment_invitations FOR SELECT
USING (coach_id = auth.uid());

-- Policy: Coach pode criar convites
CREATE POLICY "Coaches can create invitations"
ON payment_invitations FOR INSERT
WITH CHECK (coach_id = auth.uid());

-- Policy: Coach pode atualizar seus convites (cancelar)
CREATE POLICY "Coaches can update their invitations"
ON payment_invitations FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Policy: Qualquer um pode ler convites pendentes via token (para aluno acessar o link)
CREATE POLICY "Anyone can read pending invitations by token"
ON payment_invitations FOR SELECT
USING (status = 'pending' AND expires_at > NOW());

-- Comentários
COMMENT ON TABLE payment_invitations IS 'Convites de pagamento enviados por coaches para alunos que ainda não têm conta';
COMMENT ON COLUMN payment_invitations.token IS 'Token único usado no link de pagamento';
COMMENT ON COLUMN payment_invitations.due_day IS 'Dia do mês para vencimento (1-28)';
COMMENT ON COLUMN payment_invitations.expires_at IS 'Data de expiração do convite';

-- Verificar estrutura
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_invitations'
ORDER BY ordinal_position;
