-- ============================================
-- TRIGGERS PARA ENVIAR PUSH NOTIFICATIONS
-- Execute este SQL no Supabase
-- ============================================

-- Função para chamar Edge Function de push notification
CREATE OR REPLACE FUNCTION send_push_notification_http(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_url TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
  v_anon_key text;
  v_supabase_url text;
BEGIN
  -- Pegar a URL do Supabase
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://kelmdelbrqsznzckznfb.supabase.co';
  END IF;

  -- Pegar a anon key
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  IF v_anon_key IS NULL THEN
    v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlbG1kZWxicnFzem56Y2t6bmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjMzMDIsImV4cCI6MjA3NjQ5OTMwMn0.ENJsqqeX_H2c8awa0zIdM9MPShnREYieWwSlU3_TNmw';
  END IF;

  -- Fazer requisição HTTP para a Edge Function
  -- Usando pg_net (extensão do Supabase)
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := jsonb_build_object(
      'userId', p_user_id::text,
      'title', p_title,
      'body', p_body,
      'url', p_url
    )
  ) INTO v_request_id;

  -- Log para debug
  RAISE NOTICE 'Push notification enviada para user_id: %, request_id: %', p_user_id, v_request_id;

EXCEPTION WHEN OTHERS THEN
  -- Se der erro, só logar mas não falhar a transação principal
  RAISE WARNING 'Erro ao enviar push notification: %', SQLERRM;
END;
$$;

-- ============================================
-- TRIGGER PARA DIETA
-- ============================================

CREATE OR REPLACE FUNCTION notify_dieta_push()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a dieta foi ativada ou atualizada
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND (OLD.content != NEW.content OR OLD.title != NEW.title)) THEN

    -- Resetar viewed_by_aluno
    NEW.viewed_by_aluno := FALSE;

    -- Criar notificação na tabela
    INSERT INTO notifications (user_id, type, title, message, link, related_id, icon)
    VALUES (
      NEW.aluno_id,
      'dieta',
      'Nova dieta disponível! 🍽️',
      'Seu coach atualizou sua dieta: ' || NEW.title,
      '/aluno/dieta',
      NEW.id,
      'Apple'
    );

    -- Enviar push notification
    PERFORM send_push_notification_http(
      NEW.aluno_id,
      'Nova dieta disponível! 🍽️',
      'Seu coach atualizou sua dieta: ' || NEW.title,
      '/aluno/dieta'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA TREINO
-- ============================================

CREATE OR REPLACE FUNCTION notify_treino_push()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND (OLD.content != NEW.content OR OLD.title != NEW.title)) THEN

    NEW.viewed_by_aluno := FALSE;

    INSERT INTO notifications (user_id, type, title, message, link, related_id, icon)
    VALUES (
      NEW.aluno_id,
      'treino',
      'Novo treino disponível! 💪',
      'Seu coach atualizou seu treino: ' || NEW.title,
      '/aluno/treino',
      NEW.id,
      'Dumbbell'
    );

    PERFORM send_push_notification_http(
      NEW.aluno_id,
      'Novo treino disponível! 💪',
      'Seu coach atualizou seu treino: ' || NEW.title,
      '/aluno/treino'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA PROTOCOLO
-- ============================================

CREATE OR REPLACE FUNCTION notify_protocolo_push()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND (OLD.content != NEW.content OR OLD.title != NEW.title)) THEN

    NEW.viewed_by_aluno := FALSE;

    INSERT INTO notifications (user_id, type, title, message, link, related_id, icon)
    VALUES (
      NEW.aluno_id,
      'protocolo',
      'Novo protocolo disponível! 📋',
      'Seu coach atualizou seu protocolo: ' || NEW.title,
      '/aluno/protocolo',
      NEW.id,
      'FileText'
    );

    PERFORM send_push_notification_http(
      NEW.aluno_id,
      'Novo protocolo disponível! 📋',
      'Seu coach atualizou seu protocolo: ' || NEW.title,
      '/aluno/protocolo'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RECRIAR TRIGGERS
-- ============================================

-- Drop triggers antigos
DROP TRIGGER IF EXISTS dieta_activated_trigger ON dietas;
DROP TRIGGER IF EXISTS treino_activated_trigger ON treinos;
DROP TRIGGER IF EXISTS protocolo_activated_trigger ON protocolos_hormonais;

-- Criar novos triggers
CREATE TRIGGER dieta_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON dietas
  FOR EACH ROW
  EXECUTE FUNCTION notify_dieta_push();

CREATE TRIGGER treino_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON treinos
  FOR EACH ROW
  EXECUTE FUNCTION notify_treino_push();

CREATE TRIGGER protocolo_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON protocolos_hormonais
  FOR EACH ROW
  EXECUTE FUNCTION notify_protocolo_push();

-- ✅ Triggers criados com sucesso!
-- Agora quando o coach atualizar dieta/treino/protocolo, o push será enviado automaticamente
