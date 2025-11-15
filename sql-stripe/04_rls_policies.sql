-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- Descrição: Configura as permissões de acesso aos dados
-- =====================================================

-- ============ CONNECTED_ACCOUNTS ============

-- Habilitar RLS na tabela
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- Permitir que coaches vejam apenas suas próprias contas
CREATE POLICY "Coaches podem ver suas próprias contas conectadas"
  ON connected_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permitir que coaches atualizem suas próprias contas
CREATE POLICY "Coaches podem atualizar suas próprias contas"
  ON connected_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Permitir inserção apenas através de funções autorizadas
-- (normalmente feito via API backend com service_role)
CREATE POLICY "Sistema pode inserir contas conectadas"
  ON connected_accounts
  FOR INSERT
  WITH CHECK (false); -- Apenas via service_role

-- ============ TRANSACTIONS ============

-- Habilitar RLS na tabela
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Coaches podem ver transações da sua conta
CREATE POLICY "Coaches podem ver transações da sua conta"
  ON transactions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.id
      FROM profiles p
      WHERE p.stripe_account_id = transactions.connected_account_id
    )
  );

-- Alunos podem ver suas próprias transações
CREATE POLICY "Alunos podem ver suas próprias transações"
  ON transactions
  FOR SELECT
  USING (auth.uid() = student_id);

-- Apenas sistema pode inserir/atualizar transações
-- (via webhooks do Stripe com service_role)
CREATE POLICY "Sistema pode inserir transações"
  ON transactions
  FOR INSERT
  WITH CHECK (false); -- Apenas via service_role

CREATE POLICY "Sistema pode atualizar transações"
  ON transactions
  FOR UPDATE
  USING (false); -- Apenas via service_role

-- ============ FUNÇÕES AUXILIARES ============

-- Função para verificar se usuário é coach
CREATE OR REPLACE FUNCTION is_coach(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'coach'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é aluno
CREATE OR REPLACE FUNCTION is_student(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'aluno'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter total de transações do coach
CREATE OR REPLACE FUNCTION get_coach_transaction_totals(coach_id UUID)
RETURNS TABLE (
  total_transactions BIGINT,
  total_amount BIGINT,
  total_fees BIGINT,
  total_net BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_transactions,
    COALESCE(SUM(t.amount), 0)::BIGINT as total_amount,
    COALESCE(SUM(t.fee_amount), 0)::BIGINT as total_fees,
    COALESCE(SUM(t.net_amount), 0)::BIGINT as total_net
  FROM transactions t
  INNER JOIN profiles p ON p.stripe_account_id = t.connected_account_id
  WHERE p.id = coach_id
  AND t.status = 'succeeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ TRIGGERS ============

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em connected_accounts
DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============ GRANTS ============

-- Conceder permissões necessárias
GRANT SELECT ON connected_accounts TO authenticated;
GRANT SELECT ON transactions TO authenticated;

-- Service role tem acesso total (usado pelos webhooks)
GRANT ALL ON connected_accounts TO service_role;
GRANT ALL ON transactions TO service_role;

-- Comentários
COMMENT ON FUNCTION is_coach IS 'Verifica se um usuário é coach';
COMMENT ON FUNCTION is_student IS 'Verifica se um usuário é aluno';
COMMENT ON FUNCTION get_coach_transaction_totals IS 'Retorna totais de transações de um coach';
COMMENT ON FUNCTION update_updated_at_column IS 'Atualiza automaticamente a coluna updated_at';
