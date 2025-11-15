-- ============================================
-- ALTERAÇÕES PARA FUNCIONALIDADES AVANÇADAS
-- ============================================

-- 1. Adicionar campos personalizados em dietas
ALTER TABLE public.dietas
ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 6;

COMMENT ON COLUMN public.dietas.meals_per_day IS 'Número de refeições por dia (2-6)';

-- 2. Adicionar campos personalizados em treinos
ALTER TABLE public.treinos
ADD COLUMN IF NOT EXISTS workout_types TEXT[] DEFAULT ARRAY['musculacao'];

COMMENT ON COLUMN public.treinos.workout_types IS 'Tipos de treino: cardio, musculacao, luta, outros';

-- 3. Atualizar meal_tracking para ser dinâmico
-- Remover colunas fixas e usar estrutura JSON
ALTER TABLE public.meal_tracking
ADD COLUMN IF NOT EXISTS meals_completed JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.meal_tracking.meals_completed IS 'Array de índices das refeições completadas (ex: [0,1,3] = refeições 1, 2 e 4)';

-- 4. Atualizar workout_tracking para ter tipos de treino
ALTER TABLE public.workout_tracking
DROP COLUMN IF EXISTS period CASCADE;

ALTER TABLE public.workout_tracking
ADD COLUMN IF NOT EXISTS workout_types_completed TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.workout_tracking.workout_types_completed IS 'Tipos de treino completados no dia: cardio, musculacao, luta, outros';

-- 5. Adicionar controle de resumo semanal (7 dias)
ALTER TABLE public.progress_photos
ADD COLUMN IF NOT EXISTS next_allowed_date DATE;

COMMENT ON COLUMN public.progress_photos.next_allowed_date IS 'Data em que o próximo resumo pode ser enviado (created_at + 7 dias)';

-- Trigger para calcular next_allowed_date automaticamente
CREATE OR REPLACE FUNCTION set_next_allowed_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_allowed_date := (NEW.created_at::date + INTERVAL '7 days')::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_next_allowed_date ON public.progress_photos;
CREATE TRIGGER trigger_set_next_allowed_date
  BEFORE INSERT ON public.progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_next_allowed_date();

-- 6. Adicionar campo de aprovação de cadastro
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.approved IS 'Se o cadastro foi aprovado pelo coach';
COMMENT ON COLUMN public.profiles.approved_by IS 'ID do coach que aprovou';
COMMENT ON COLUMN public.profiles.approved_at IS 'Data/hora da aprovação';

-- Índice para buscar usuários não aprovados
CREATE INDEX IF NOT EXISTS idx_profiles_not_approved ON public.profiles(approved) WHERE approved = false;

-- 7. Criar tabela de notificações de vencimento
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  due_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(aluno_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_not_sent ON public.payment_reminders(sent, reminder_date) WHERE sent = false;

COMMENT ON TABLE public.payment_reminders IS 'Lembretes de vencimento de pagamento (3 dias antes)';

-- RLS para payment_reminders
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos veem seus próprios lembretes"
  ON public.payment_reminders
  FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Sistema pode criar lembretes"
  ON public.payment_reminders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar lembretes"
  ON public.payment_reminders
  FOR UPDATE
  USING (true);

-- 8. Função para criar lembretes de vencimento
CREATE OR REPLACE FUNCTION create_payment_reminders()
RETURNS void AS $$
DECLARE
  aluno_record RECORD;
  due_date DATE;
  reminder_date DATE;
BEGIN
  -- Para cada aluno ativo com dia de vencimento definido
  FOR aluno_record IN
    SELECT id, payment_due_day
    FROM public.profiles
    WHERE payment_due_day IS NOT NULL
      AND role = 'aluno'
      AND approved = true
  LOOP
    -- Calcular data de vencimento do mês atual
    due_date := DATE_TRUNC('month', CURRENT_DATE)::DATE + (aluno_record.payment_due_day - 1);

    -- Se já passou, calcular para o próximo mês
    IF due_date < CURRENT_DATE THEN
      due_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE + (aluno_record.payment_due_day - 1);
    END IF;

    -- Data do lembrete: 3 dias antes
    reminder_date := due_date - INTERVAL '3 days';

    -- Criar lembrete se ainda não existe
    INSERT INTO public.payment_reminders (aluno_id, reminder_date, due_date, days_before)
    VALUES (aluno_record.id, reminder_date, due_date, 3)
    ON CONFLICT (aluno_id, reminder_date) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_payment_reminders() IS 'Cria lembretes de vencimento 3 dias antes para todos os alunos';

-- 9. View para lembretes ativos (hoje)
CREATE OR REPLACE VIEW active_payment_reminders AS
SELECT
  pr.id,
  pr.aluno_id,
  pr.reminder_date,
  pr.due_date,
  pr.days_before,
  p.full_name,
  p.email
FROM public.payment_reminders pr
JOIN public.profiles p ON p.id = pr.aluno_id
WHERE pr.sent = false
  AND pr.reminder_date = CURRENT_DATE;

-- 10. Atualizar função check_payment_status para criar lembretes
CREATE OR REPLACE FUNCTION check_payment_status()
RETURNS void AS $$
DECLARE
  aluno RECORD;
  today DATE := CURRENT_DATE;
  due_date DATE;
  overdue_date DATE;
BEGIN
  -- Primeiro criar lembretes
  PERFORM create_payment_reminders();

  -- Depois verificar status de pagamento (código existente)
  FOR aluno IN
    SELECT id, payment_due_day, last_payment_date, payment_status
    FROM public.profiles
    WHERE payment_due_day IS NOT NULL
      AND role = 'aluno'
      AND approved = true
  LOOP
    due_date := LEAST(
      DATE_TRUNC('month', today) + INTERVAL '1 month' - INTERVAL '1 day',
      DATE_TRUNC('month', today) + (aluno.payment_due_day - 1) * INTERVAL '1 day'
    )::DATE;

    IF due_date < DATE_TRUNC('month', today)::DATE THEN
      due_date := LEAST(
        DATE_TRUNC('month', today) + INTERVAL '1 month' - INTERVAL '1 day',
        DATE_TRUNC('month', today) + (aluno.payment_due_day - 1) * INTERVAL '1 day'
      )::DATE;
    END IF;

    overdue_date := due_date + INTERVAL '3 days';

    IF aluno.last_payment_date IS NULL OR
       DATE_TRUNC('month', aluno.last_payment_date) < DATE_TRUNC('month', today) THEN

      IF today > overdue_date THEN
        UPDATE public.profiles
        SET payment_status = 'overdue'
        WHERE id = aluno.id AND payment_status != 'overdue';
      ELSIF today >= due_date THEN
        UPDATE public.profiles
        SET payment_status = 'pending'
        WHERE id = aluno.id AND payment_status NOT IN ('overdue', 'pending');
      END IF;
    ELSE
      IF aluno.payment_status != 'active' THEN
        UPDATE public.profiles
        SET payment_status = 'active'
        WHERE id = aluno.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
