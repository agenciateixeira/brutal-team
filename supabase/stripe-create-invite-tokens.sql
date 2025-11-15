-- ============================================
-- CRIAR TABELA INVITE_TOKENS
-- ============================================
-- Sistema de convites para vincular alunos aos coaches
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Informações do aluno convidado
  aluno_email TEXT,
  aluno_name TEXT,

  -- Data de vencimento do pagamento
  payment_due_day INTEGER NOT NULL,

  -- Status do convite
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,

  -- Expiração
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_due_day CHECK (payment_due_day >= 1 AND payment_due_day <= 28)
);

-- Comentários
COMMENT ON TABLE invite_tokens IS 'Convites gerados por coaches para cadastrar alunos';
COMMENT ON COLUMN invite_tokens.token IS 'Token único do convite (12 caracteres)';
COMMENT ON COLUMN invite_tokens.coach_id IS 'ID do coach que criou o convite';
COMMENT ON COLUMN invite_tokens.aluno_email IS 'Email do aluno convidado (opcional)';
COMMENT ON COLUMN invite_tokens.aluno_name IS 'Nome do aluno convidado (opcional)';
COMMENT ON COLUMN invite_tokens.payment_due_day IS 'Dia do mês para vencimento (1-28)';
COMMENT ON COLUMN invite_tokens.used IS 'Se o convite já foi utilizado';
COMMENT ON COLUMN invite_tokens.used_by IS 'ID do aluno que usou o convite';
COMMENT ON COLUMN invite_tokens.used_at IS 'Data/hora que o convite foi usado';
COMMENT ON COLUMN invite_tokens.expires_at IS 'Data/hora de expiração do convite';

-- Índices
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_coach ON invite_tokens(coach_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_used ON invite_tokens(used);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires ON invite_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_used_by ON invite_tokens(used_by);

-- Habilitar RLS
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
-- Coaches podem ver e criar seus próprios convites
CREATE POLICY "Coaches can view their own invites"
  ON invite_tokens FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create invites"
  ON invite_tokens FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their invites"
  ON invite_tokens FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their invites"
  ON invite_tokens FOR DELETE
  USING (auth.uid() = coach_id);

-- Qualquer um pode visualizar convites válidos (para validação no cadastro)
CREATE POLICY "Anyone can view valid invites"
  ON invite_tokens FOR SELECT
  USING (used = false AND expires_at > NOW());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_invite_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invite_tokens_updated_at
  BEFORE UPDATE ON invite_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_invite_tokens_updated_at();

-- Verificar se funcionou
SELECT * FROM invite_tokens LIMIT 1;
