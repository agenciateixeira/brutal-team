-- Adicionar coluna reference_month se não existir
ALTER TABLE public.payment_history
ADD COLUMN IF NOT EXISTS reference_month TEXT;

-- Adicionar comentário
COMMENT ON COLUMN public.payment_history.reference_month IS 'Mês de referência do pagamento (formato: YYYY-MM)';
