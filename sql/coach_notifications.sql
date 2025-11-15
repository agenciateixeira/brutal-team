-- Tabela de notificações para o coach
CREATE TABLE IF NOT EXISTS public.coach_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'photo', 'message', 'diet', 'workout', 'protocol'
  reference_id UUID, -- ID do item que gerou a notificação
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coach_notifications_coach_id ON public.coach_notifications(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_notifications_aluno_id ON public.coach_notifications(aluno_id);
CREATE INDEX IF NOT EXISTS idx_coach_notifications_is_viewed ON public.coach_notifications(is_viewed);
CREATE INDEX IF NOT EXISTS idx_coach_notifications_type ON public.coach_notifications(notification_type);

-- RLS Policies
ALTER TABLE public.coach_notifications ENABLE ROW LEVEL SECURITY;

-- Coach pode ver suas próprias notificações
CREATE POLICY "Coach pode ver suas notificações"
  ON public.coach_notifications
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Coach pode atualizar suas notificações (marcar como visto)
CREATE POLICY "Coach pode atualizar suas notificações"
  ON public.coach_notifications
  FOR UPDATE
  USING (auth.uid() = coach_id);

-- Sistema pode inserir notificações
CREATE POLICY "Sistema pode inserir notificações"
  ON public.coach_notifications
  FOR INSERT
  WITH CHECK (true);

-- Trigger para criar notificação quando aluno adiciona foto
CREATE OR REPLACE FUNCTION notify_coach_new_photo()
RETURNS TRIGGER AS $$
DECLARE
  coach_id_var UUID;
BEGIN
  -- Buscar o coach do aluno
  SELECT coach_id INTO coach_id_var
  FROM public.profiles
  WHERE id = NEW.aluno_id;

  -- Criar notificação se houver coach
  IF coach_id_var IS NOT NULL THEN
    INSERT INTO public.coach_notifications (coach_id, aluno_id, notification_type, reference_id)
    VALUES (coach_id_var, NEW.aluno_id, 'photo', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_coach_new_photo ON public.progress_photos;
CREATE TRIGGER trigger_notify_coach_new_photo
  AFTER INSERT ON public.progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_new_photo();

-- Trigger para criar notificação quando aluno envia mensagem
CREATE OR REPLACE FUNCTION notify_coach_new_message()
RETURNS TRIGGER AS $$
DECLARE
  coach_id_var UUID;
BEGIN
  -- Apenas notificar se a mensagem é do aluno (não do coach)
  SELECT coach_id INTO coach_id_var
  FROM public.profiles
  WHERE id = NEW.sender_id AND role = 'aluno';

  -- Criar notificação se for mensagem de aluno
  IF coach_id_var IS NOT NULL THEN
    INSERT INTO public.coach_notifications (coach_id, aluno_id, notification_type, reference_id)
    VALUES (coach_id_var, NEW.sender_id, 'message', NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_coach_new_message ON public.messages;
CREATE TRIGGER trigger_notify_coach_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_new_message();

-- View para contar notificações não visualizadas por aluno e tipo
CREATE OR REPLACE VIEW coach_notifications_summary AS
SELECT
  coach_id,
  aluno_id,
  notification_type,
  COUNT(*) as unviewed_count
FROM public.coach_notifications
WHERE is_viewed = false
GROUP BY coach_id, aluno_id, notification_type;

-- Função para marcar notificações como visualizadas
CREATE OR REPLACE FUNCTION mark_notifications_as_viewed(
  p_coach_id UUID,
  p_aluno_id UUID,
  p_notification_type TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.coach_notifications
  SET is_viewed = true
  WHERE coach_id = p_coach_id
    AND aluno_id = p_aluno_id
    AND notification_type = p_notification_type
    AND is_viewed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações de um aluno como visualizadas
CREATE OR REPLACE FUNCTION mark_all_aluno_notifications_as_viewed(
  p_coach_id UUID,
  p_aluno_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.coach_notifications
  SET is_viewed = true
  WHERE coach_id = p_coach_id
    AND aluno_id = p_aluno_id
    AND is_viewed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.coach_notifications IS 'Notificações de atualizações dos alunos para o coach';
COMMENT ON FUNCTION mark_notifications_as_viewed IS 'Marca notificações específicas como visualizadas pelo coach';
COMMENT ON FUNCTION mark_all_aluno_notifications_as_viewed IS 'Marca todas as notificações de um aluno como visualizadas';
