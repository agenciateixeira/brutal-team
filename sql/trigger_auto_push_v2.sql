-- ========================================
-- TRIGGER PARA ENVIAR PUSH AUTOMATICAMENTE V2
-- Chama a edge function quando uma notificação é inserida
-- ========================================

-- 1. Habilitar pg_net se ainda não estiver habilitado
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Criar função que chama a edge function
CREATE OR REPLACE FUNCTION send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
  v_function_url text;
  v_service_key text;
BEGIN
  -- URL da edge function (ajustar conforme necessário)
  v_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  v_service_key := current_setting('app.settings.service_role_key', true);

  -- Se não conseguir pegar das configurações, usar valores padrão (TEMPORÁRIO)
  IF v_function_url IS NULL OR v_service_key IS NULL THEN
    v_function_url := 'https://bgohxramptkrnepvmefc.supabase.co/functions/v1/send-push-notification';
    v_service_key := current_setting('app.settings.service_role_key', true);
  END IF;

  -- Chamar edge function
  SELECT extensions.http_post(
    url => v_function_url,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body => jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.message, ''),
      'data', COALESCE(NEW.data, '{}'::jsonb),
      'url', COALESCE(NEW.link, '/')
    )::text
  ) INTO v_request_id;

  RAISE NOTICE 'Push notification request ID: %', v_request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar a inserção se o push falhar
    RAISE WARNING 'Erro ao enviar push (será tentado novamente): %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Criar trigger
DROP TRIGGER IF EXISTS trigger_send_push_on_notification ON notifications;
CREATE TRIGGER trigger_send_push_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  WHEN (NEW.read IS FALSE) -- Só envia push para notificações não lidas
  EXECUTE FUNCTION send_push_on_notification();

-- 4. Verificar se o trigger foi criado
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_send_push_on_notification';
