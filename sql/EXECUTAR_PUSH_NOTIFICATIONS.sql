-- ========================================
-- PUSH NOTIFICATIONS PARA COMUNIDADE
-- Execute este SQL no Supabase Dashboard
-- ========================================

-- 1. Criar tabela de notificações (histórico)
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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Função para notificar membros da comunidade
CREATE OR REPLACE FUNCTION notify_community_post(
  p_community_id UUID,
  p_author_id UUID,
  p_author_name TEXT,
  p_community_name TEXT,
  p_content TEXT,
  p_post_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_pref RECORD;
BEGIN
  -- Buscar todos os membros da comunidade (exceto o autor)
  FOR v_member IN
    SELECT DISTINCT cm.aluno_id
    FROM community_members cm
    WHERE cm.community_id = p_community_id
      AND cm.aluno_id != p_author_id
  LOOP
    -- Verificar preferências do membro
    SELECT * INTO v_pref
    FROM notification_preferences
    WHERE user_id = v_member.aluno_id;

    -- Se push e notificações de comunidade estiverem ativadas, criar notificação
    IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
      INSERT INTO notifications (user_id, title, body, type, data, is_read)
      VALUES (
        v_member.aluno_id,
        '📱 Novo post em ' || COALESCE(p_community_name, 'comunidade'),
        COALESCE(p_author_name, 'Alguém') || ' publicou: ' || LEFT(p_content, 100),
        'new_post',
        jsonb_build_object(
          'post_id', p_post_id,
          'community_id', p_community_id,
          'url', '/aluno/comunidade?post=' || p_post_id
        ),
        false
      );
    END IF;
  END LOOP;
END;
$$;

-- 3. Trigger para novos posts na comunidade
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

  -- Notificar membros
  PERFORM notify_community_post(
    NEW.community_id,
    NEW.author_id,
    v_author_name,
    v_community_name,
    NEW.content,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_community_post ON community_posts;
CREATE TRIGGER trigger_new_community_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_post();

-- 4. Trigger para curtidas em posts
CREATE OR REPLACE FUNCTION trigger_notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_liker_name TEXT;
  v_post_author_id UUID;
  v_pref RECORD;
BEGIN
  -- Buscar autor do post
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Não notificar se a pessoa curtiu o próprio post
  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Verificar preferências
  SELECT * INTO v_pref
  FROM notification_preferences
  WHERE user_id = v_post_author_id;

  -- Se push e notificações de comunidade estiverem ativadas, criar notificação
  IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
    -- Buscar nome de quem curtiu
    SELECT full_name INTO v_liker_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Criar notificação
    INSERT INTO notifications (user_id, title, body, type, data, is_read)
    VALUES (
      v_post_author_id,
      '❤️ Curtida em seu post',
      COALESCE(v_liker_name, 'Alguém') || ' curtiu seu post',
      'like',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'url', '/aluno/comunidade?post=' || NEW.post_id
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_post_like ON post_likes;
CREATE TRIGGER trigger_new_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_like();

-- 5. Trigger para comentários em posts
CREATE OR REPLACE FUNCTION trigger_notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commenter_name TEXT;
  v_post_author_id UUID;
  v_pref RECORD;
BEGIN
  -- Buscar autor do post
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Não notificar se a pessoa comentou no próprio post
  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Verificar preferências
  SELECT * INTO v_pref
  FROM notification_preferences
  WHERE user_id = v_post_author_id;

  -- Se push e notificações de comunidade estiverem ativadas, criar notificação
  IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
    -- Buscar nome de quem comentou
    SELECT full_name INTO v_commenter_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Criar notificação
    INSERT INTO notifications (user_id, title, body, type, data, is_read)
    VALUES (
      v_post_author_id,
      '💬 Novo comentário',
      COALESCE(v_commenter_name, 'Alguém') || ' comentou: ' || LEFT(NEW.content, 100),
      'comment',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'url', '/aluno/comunidade?post=' || NEW.post_id
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_post_comment ON post_comments;
CREATE TRIGGER trigger_new_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_comment();

-- ========================================
-- PRONTO! Agora o sistema vai:
-- 1. Criar notificações automáticas
-- 2. Respeitar preferências de cada usuário
-- 3. Funcionar para posts, curtidas e comentários
-- ========================================
