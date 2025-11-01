-- ============================================
-- DIAGNÓSTICO: Verificar protocolo
-- Execute este SQL no Supabase para diagnosticar
-- ============================================

-- 1. Verificar se a coluna viewed_by_aluno existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'protocolos_hormonais'
AND column_name = 'viewed_by_aluno';

-- 2. Ver o valor atual do protocolo ativo
SELECT id, title, active, viewed_by_aluno, created_at
FROM protocolos_hormonais
WHERE active = true
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar as policies (RLS) da tabela
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'protocolos_hormonais';
