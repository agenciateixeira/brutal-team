-- ============================================
-- REMOVER SISTEMA ANTIGO DE CONVITES E APROVAÇÃO MANUAL
-- ============================================
-- Este script remove o sistema antigo que usava:
-- - invite_tokens (convites com token único)
-- - access_codes (códigos de aprovação manual)
--
-- O novo sistema usa payment_invitations (convites com pagamento via Stripe)
-- ============================================

-- 1. Dropar tabela de códigos de acesso (aprovação manual)
DROP TABLE IF EXISTS access_codes CASCADE;

-- 2. Dropar tabela de tokens de convite antigos
DROP TABLE IF EXISTS invite_tokens CASCADE;

-- 3. Remover funções relacionadas (se existirem)
DROP FUNCTION IF EXISTS generate_invite_token() CASCADE;
DROP FUNCTION IF EXISTS generate_access_code() CASCADE;

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
-- As seguintes tabelas foram removidas:
-- ✅ access_codes
-- ✅ invite_tokens
--
-- O sistema agora usa apenas:
-- ✅ payment_invitations (novo sistema com Stripe)
-- ============================================
