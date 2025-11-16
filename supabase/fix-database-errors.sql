-- ============================================
-- CORRIGIR ERROS DO BANCO DE DADOS
-- ============================================

-- 1. REMOVER TRIGGER E FUNÇÃO DO SISTEMA ANTIGO (access_codes)
-- ============================================

-- Remover triggers se existirem (ambos os nomes possíveis)
DROP TRIGGER IF EXISTS on_profile_approved ON profiles;
DROP TRIGGER IF EXISTS trigger_create_access_code ON profiles;

-- Remover função se existir (agora sem dependências)
DROP FUNCTION IF EXISTS create_access_code_on_approval();

-- 2. ADICIONAR COLUNA stripe_session_id SE NÃO EXISTIR
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_invitations'
    AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE payment_invitations
    ADD COLUMN stripe_session_id TEXT;

    RAISE NOTICE 'Coluna stripe_session_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna stripe_session_id já existe';
  END IF;
END $$;

-- 3. VERIFICAR SE TUDO ESTÁ OK
-- ============================================

-- Verificar se trigger foi removido
SELECT
  'TRIGGERS REMAINING' as check_type,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name = 'on_profile_approved';

-- Verificar se coluna existe
SELECT
  'STRIPE_SESSION_ID_COLUMN' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_invitations'
    AND column_name = 'stripe_session_id'
  ) as column_exists;

-- Verificar estrutura da tabela payment_invitations
SELECT
  'PAYMENT_INVITATIONS_COLUMNS' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payment_invitations'
ORDER BY ordinal_position;
