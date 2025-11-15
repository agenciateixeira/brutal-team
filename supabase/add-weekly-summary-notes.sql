-- ============================================
-- ADICIONAR CAMPOS DE NOTAS E OBSERVAÇÕES NO RESUMO SEMANAL
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Adicionar campo de notas privadas do coach (apenas para ele)
ALTER TABLE public.weekly_summary
ADD COLUMN IF NOT EXISTS coach_private_notes TEXT;

-- Adicionar campo de observação pública (que o aluno vê por 7 dias)
ALTER TABLE public.weekly_summary
ADD COLUMN IF NOT EXISTS coach_public_observation TEXT;

-- Adicionar data de quando a observação pública foi enviada
ALTER TABLE public.weekly_summary
ADD COLUMN IF NOT EXISTS coach_public_observation_sent_at TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.weekly_summary.coach_private_notes IS 'Notas privadas do coach para análise interna (aluno não vê)';
COMMENT ON COLUMN public.weekly_summary.coach_public_observation IS 'Observação do coach que aparece na dashboard do aluno por 7 dias';
COMMENT ON COLUMN public.weekly_summary.coach_public_observation_sent_at IS 'Data de envio da observação pública';

-- ✅ CAMPOS ADICIONADOS!
--
-- O QUE FOI FEITO:
-- 1. ✅ Campo coach_private_notes - Notas privadas apenas para o coach
-- 2. ✅ Campo coach_public_observation - Observação que o aluno vê
-- 3. ✅ Campo coach_public_observation_sent_at - Controle de 7 dias
--
-- PRÓXIMOS PASSOS:
-- 1. Coach pode escrever notas privadas no resumo semanal
-- 2. Coach pode enviar observação pública que aparece para o aluno
-- 3. Observação some automaticamente após 7 dias ou quando aluno enviar novo resumo
