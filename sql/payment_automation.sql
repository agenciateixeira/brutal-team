-- Adicionar campo de dia de vencimento
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_due_day INTEGER;

COMMENT ON COLUMN public.profiles.payment_due_day IS 'Dia do mês em que o pagamento vence (1-31)';

-- Adicionar campo de última data de pagamento
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_payment_date DATE;

COMMENT ON COLUMN public.profiles.last_payment_date IS 'Data do último pagamento registrado';

-- Função para verificar e atualizar status de pagamento automaticamente
CREATE OR REPLACE FUNCTION check_payment_status()
RETURNS void AS $$
DECLARE
  aluno RECORD;
  today DATE := CURRENT_DATE;
  due_date DATE;
  overdue_date DATE;
BEGIN
  -- Iterar sobre todos os alunos que têm dia de vencimento definido
  FOR aluno IN
    SELECT id, payment_due_day, last_payment_date, payment_status
    FROM public.profiles
    WHERE payment_due_day IS NOT NULL
      AND role = 'aluno'
  LOOP
    -- Calcular a data de vencimento do mês atual
    -- Se o dia de vencimento for maior que os dias do mês atual, usar o último dia do mês
    due_date := LEAST(
      DATE_TRUNC('month', today) + INTERVAL '1 month' - INTERVAL '1 day',
      DATE_TRUNC('month', today) + (aluno.payment_due_day - 1) * INTERVAL '1 day'
    )::DATE;

    -- Se o vencimento é do mês anterior, ajustar para o mês atual
    IF due_date < DATE_TRUNC('month', today)::DATE THEN
      due_date := LEAST(
        DATE_TRUNC('month', today) + INTERVAL '1 month' - INTERVAL '1 day',
        DATE_TRUNC('month', today) + (aluno.payment_due_day - 1) * INTERVAL '1 day'
      )::DATE;
    END IF;

    -- Data de inadimplência (3 dias após o vencimento)
    overdue_date := due_date + INTERVAL '3 days';

    -- Verificar se o último pagamento foi neste mês
    IF aluno.last_payment_date IS NULL OR
       DATE_TRUNC('month', aluno.last_payment_date) < DATE_TRUNC('month', today) THEN

      -- Não pagou neste mês
      IF today > overdue_date THEN
        -- Passou 3 dias do vencimento -> inadimplente
        UPDATE public.profiles
        SET payment_status = 'overdue'
        WHERE id = aluno.id AND payment_status != 'overdue';

      ELSIF today >= due_date THEN
        -- É o dia do vencimento ou passou, mas ainda não são 3 dias -> pendente
        UPDATE public.profiles
        SET payment_status = 'pending'
        WHERE id = aluno.id AND payment_status NOT IN ('overdue', 'pending');

      END IF;

    ELSE
      -- Pagou neste mês -> ativo
      IF aluno.payment_status != 'active' THEN
        UPDATE public.profiles
        SET payment_status = 'active'
        WHERE id = aluno.id;
      END IF;

    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar last_payment_date quando um pagamento é registrado
CREATE OR REPLACE FUNCTION update_last_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_payment_date = NEW.payment_date,
    payment_status = 'active'
  WHERE id = NEW.aluno_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela payment_history
DROP TRIGGER IF EXISTS trigger_update_last_payment_date ON public.payment_history;
CREATE TRIGGER trigger_update_last_payment_date
  AFTER INSERT ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_last_payment_date();

-- Comentário
COMMENT ON FUNCTION check_payment_status() IS 'Verifica e atualiza automaticamente o status de pagamento dos alunos baseado na data de vencimento';
