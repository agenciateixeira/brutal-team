-- ========================================
-- TRIGGER PARA ENVIAR PUSH AUTOMATICAMENTE
-- Chama a edge function quando uma notificação é inserida
-- ========================================

-- 1. Criar função que chama a edge function
CREATE OR REPLACE FUNCTION send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  -- Chamar edge function de forma assíncrona usando pg_net
  SELECT net.http_post(
    url := (SELECT url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_FUNCTION_URL') || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.message, NEW.body),
      'data', NEW.data,
      'url', COALESCE(NEW.link, '/')
    )
  ) INTO v_request_id;

  RAISE NOTICE 'Push notification request ID: %', v_request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar a inserção se o push falhar
    RAISE WARNING 'Erro ao enviar push: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Criar trigger
DROP TRIGGER IF EXISTS trigger_send_push_on_notification ON notifications;
CREATE TRIGGER trigger_send_push_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  WHEN (NEW.read IS FALSE) -- Só envia push para notificações não lidas
  EXECUTE FUNCTION send_push_on_notification();

-- 3. Verificar se o trigger foi criado
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_push_on_notification';
