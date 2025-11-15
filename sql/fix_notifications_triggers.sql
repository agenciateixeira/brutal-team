-- Corrigir trigger de notificação de fotos
CREATE OR REPLACE FUNCTION notify_coach_new_photo()
RETURNS TRIGGER AS $$
DECLARE
  coach_record RECORD;
BEGIN
  -- Notificar todos os coaches (já que o sistema permite múltiplos coaches)
  FOR coach_record IN
    SELECT id FROM public.profiles WHERE role = 'coach'
  LOOP
    INSERT INTO public.coach_notifications (coach_id, aluno_id, notification_type, reference_id)
    VALUES (coach_record.id, NEW.aluno_id, 'photo', NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrigir trigger de notificação de mensagens
CREATE OR REPLACE FUNCTION notify_coach_new_message()
RETURNS TRIGGER AS $$
DECLARE
  coach_record RECORD;
  sender_role TEXT;
BEGIN
  -- Verificar se quem enviou é aluno
  SELECT role INTO sender_role
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Apenas notificar se a mensagem é do aluno (não do coach)
  IF sender_role = 'aluno' THEN
    -- Notificar todos os coaches
    FOR coach_record IN
      SELECT id FROM public.profiles WHERE role = 'coach'
    LOOP
      INSERT INTO public.coach_notifications (coach_id, aluno_id, notification_type, reference_id)
      VALUES (coach_record.id, NEW.aluno_id, 'message', NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar os triggers
DROP TRIGGER IF EXISTS trigger_notify_coach_new_photo ON public.progress_photos;
CREATE TRIGGER trigger_notify_coach_new_photo
  AFTER INSERT ON public.progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_new_photo();

DROP TRIGGER IF EXISTS trigger_notify_coach_new_message ON public.messages;
CREATE TRIGGER trigger_notify_coach_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_coach_new_message();
