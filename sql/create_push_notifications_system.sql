-- Tabela para armazenar tokens de push subscription
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Tabela de notificações (histórico)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para push_subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para enviar notificação push
CREATE OR REPLACE FUNCTION notify_community_members(
  p_community_id UUID,
  p_author_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Buscar todos os membros da comunidade (exceto o autor)
  FOR v_member IN
    SELECT DISTINCT cm.aluno_id
    FROM community_members cm
    WHERE cm.community_id = p_community_id
      AND cm.aluno_id != p_author_id
  LOOP
    -- Chamar edge function para enviar push
    PERFORM
      net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
        ),
        body := jsonb_build_object(
          'user_id', v_member.aluno_id,
          'title', p_title,
          'body', p_body,
          'type', p_type,
          'data', p_data
        )
      );
  END LOOP;
END;
$$;

-- Trigger para novos posts na comunidade
CREATE OR REPLACE FUNCTION trigger_notify_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author_name TEXT;
  v_community_name TEXT;
BEGIN
  -- Buscar nome do autor
  SELECT full_name INTO v_author_name
  FROM profiles
  WHERE id = NEW.author_id;

  -- Buscar nome da comunidade
  SELECT name INTO v_community_name
  FROM communities
  WHERE id = NEW.community_id;

  -- Enviar notificação assíncrona
  PERFORM notify_community_members(
    NEW.community_id,
    NEW.author_id,
    '📱 Novo post em ' || COALESCE(v_community_name, 'comunidade'),
    COALESCE(v_author_name, 'Alguém') || ' publicou: ' || LEFT(NEW.content, 100),
    'new_post',
    jsonb_build_object(
      'post_id', NEW.id,
      'community_id', NEW.community_id,
      'url', '/aluno/comunidade?post=' || NEW.id
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger para curtidas em posts
CREATE OR REPLACE FUNCTION trigger_notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_liker_name TEXT;
  v_post_author_id UUID;
  v_post_content TEXT;
BEGIN
  -- Buscar autor do post
  SELECT author_id, content INTO v_post_author_id, v_post_content
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Não notificar se a pessoa curtiu o próprio post
  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Buscar nome de quem curtiu
  SELECT full_name INTO v_liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Enviar notificação para o autor do post
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := jsonb_build_object(
        'user_id', v_post_author_id,
        'title', '❤️ Curtida em seu post',
        'body', COALESCE(v_liker_name, 'Alguém') || ' curtiu seu post',
        'type', 'like',
        'data', jsonb_build_object(
          'post_id', NEW.post_id,
          'url', '/aluno/comunidade?post=' || NEW.post_id
        )
      )
    );

  RETURN NEW;
END;
$$;

-- Trigger para comentários em posts
CREATE OR REPLACE FUNCTION trigger_notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commenter_name TEXT;
  v_post_author_id UUID;
BEGIN
  -- Buscar autor do post
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Não notificar se a pessoa comentou no próprio post
  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Buscar nome de quem comentou
  SELECT full_name INTO v_commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Enviar notificação para o autor do post
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := jsonb_build_object(
        'user_id', v_post_author_id,
        'title', '💬 Novo comentário',
        'body', COALESCE(v_commenter_name, 'Alguém') || ' comentou: ' || LEFT(NEW.content, 100),
        'type', 'comment',
        'data', jsonb_build_object(
          'post_id', NEW.post_id,
          'comment_id', NEW.id,
          'url', '/aluno/comunidade?post=' || NEW.post_id
        )
      )
    );

  RETURN NEW;
END;
$$;

-- Criar triggers
DROP TRIGGER IF EXISTS trigger_new_community_post ON community_posts;
CREATE TRIGGER trigger_new_community_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_post();

DROP TRIGGER IF EXISTS trigger_new_post_like ON post_likes;
CREATE TRIGGER trigger_new_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_like();

DROP TRIGGER IF EXISTS trigger_new_post_comment ON post_comments;
CREATE TRIGGER trigger_new_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_comment();

-- Função helper para limpar notificações antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;
