-- ============================================
-- CORRIGIR PRIMEIRO ACESSO PARA NOVO SISTEMA DE PAGAMENTO
-- ============================================
-- Alunos que vêm do novo sistema (payment_invitations + Stripe)
-- não precisam de código único. Vamos marcar eles como approved
-- e pular a etapa de código.
-- ============================================

-- 1. Verificar se coluna first_access_completed existe em profiles
-- Se não existir, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'first_access_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_access_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Marcar alunos com subscriptions ativas como first_access_completed
UPDATE profiles
SET first_access_completed = TRUE
WHERE id IN (
  SELECT DISTINCT aluno_id
  FROM subscriptions
  WHERE status IN ('active', 'trialing')
)
AND role = 'aluno'
AND first_access_completed = FALSE;

-- 3. Comentar: Para novos alunos, o processamento manual ou webhook
--    deve marcar first_access_completed = TRUE automaticamente

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
SELECT
  COUNT(*) as total_alunos_marcados
FROM profiles
WHERE role = 'aluno'
AND first_access_completed = TRUE;
