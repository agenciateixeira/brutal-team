-- ============================================
-- FIX: Remover constraint UNIQUE de temp_email
-- Permite que usuários preencham anamnese novamente após deletar perfil
-- ============================================

-- Remover a constraint UNIQUE do campo temp_email
ALTER TABLE anamnese_responses
DROP CONSTRAINT IF EXISTS anamnese_responses_temp_email_key;

-- Manter o índice para performance (mas sem unicidade)
-- O índice já existe, então não precisa recriar

-- ✅ CONSTRAINT REMOVIDA!
--
-- AGORA:
-- ✅ Usuários podem preencher o questionário múltiplas vezes
-- ✅ Se deletarem o perfil, podem se cadastrar novamente
-- ✅ Permite múltiplos registros do mesmo email (útil para testes incompletos)
--
-- NOTA: O índice idx_anamnese_temp_email permanece para performance de busca
