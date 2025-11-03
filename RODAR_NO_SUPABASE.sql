-- =====================================================
-- SISTEMA DE INDICAÇÃO - BRUTAL TEAM
-- =====================================================
-- INSTRUÇÕES:
-- 1. Abra seu Supabase Dashboard
-- 2. Vá em: Database → SQL Editor
-- 3. Crie um "New query"
-- 4. Cole TUDO deste arquivo
-- 5. Clique em "Run" (ou pressione Ctrl+Enter)
-- =====================================================

-- Adicionar coluna referral_code na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES profiles(referral_code);

-- Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Criar tabela de indicações
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  referred_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  discount_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Habilitar RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para referrals

-- Alunos podem ver apenas suas próprias indicações
CREATE POLICY "Alunos podem ver suas indicações"
ON referrals FOR SELECT
USING (
  auth.uid() = referrer_id
);

-- Coaches podem ver indicações de seus alunos
CREATE POLICY "Coaches podem ver indicações de seus alunos"
ON referrals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles aluno
    WHERE aluno.id = referrals.referrer_id
    AND aluno.coach_id = auth.uid()
  )
);

-- Permitir inserção de referrals (usado no cadastro)
CREATE POLICY "Permitir inserção de referrals"
ON referrals FOR INSERT
WITH CHECK (true);

-- Coaches podem atualizar status das indicações de seus alunos
CREATE POLICY "Coaches podem atualizar indicações"
ON referrals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles aluno
    WHERE aluno.id = referrals.referrer_id
    AND aluno.coach_id = auth.uid()
  )
);

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código: BRUTAL-{6 caracteres alfanuméricos}
    new_code := 'BRUTAL-' || upper(substring(md5(random()::text) from 1 for 6));

    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;

    -- Se não existe, retornar
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente em novos usuários
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- View para estatísticas de indicações
CREATE OR REPLACE VIEW referral_stats AS
SELECT
  p.id as user_id,
  p.full_name,
  p.referral_code,
  COUNT(r.id) FILTER (WHERE r.status = 'active') as active_referrals,
  COUNT(r.id) FILTER (WHERE r.status = 'pending') as pending_referrals,
  COUNT(r.id) FILTER (WHERE r.status IN ('active', 'pending')) as total_referrals,
  LEAST(COUNT(r.id) FILTER (WHERE r.status = 'active') * 10, 100) as discount_percentage,
  CASE
    WHEN COUNT(r.id) FILTER (WHERE r.status = 'active') >= 10 THEN true
    ELSE false
  END as has_full_discount
FROM profiles p
LEFT JOIN referrals r ON p.id = r.referrer_id
GROUP BY p.id, p.full_name, p.referral_code;

-- Comentários
COMMENT ON TABLE referrals IS 'Sistema de indicações - tracking de indicações feitas pelos alunos';
COMMENT ON COLUMN profiles.referral_code IS 'Código único de indicação do usuário';
COMMENT ON COLUMN profiles.referred_by IS 'Código de quem indicou este usuário';
COMMENT ON COLUMN referrals.status IS 'Status da indicação: pending (aguardando ativação), active (ativa e gerando desconto), cancelled (cancelada), expired (expirada)';
COMMENT ON COLUMN referrals.discount_applied IS 'Se o desconto foi aplicado na mensalidade';

-- =====================================================
-- PASSO 2: GERAR CÓDIGOS PARA USUÁRIOS EXISTENTES
-- =====================================================
-- Execute DEPOIS que a migration acima rodar com sucesso:

UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- =====================================================
-- FINALIZADO!
-- =====================================================
-- ✅ Tabelas criadas
-- ✅ Índices criados
-- ✅ Policies de segurança configuradas
-- ✅ Funções e triggers criados
-- ✅ View de estatísticas criada
-- ✅ Códigos gerados para usuários existentes
--
-- Agora você pode testar o sistema no localhost!
-- =====================================================
