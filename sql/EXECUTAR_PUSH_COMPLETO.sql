-- ========================================
-- PUSH NOTIFICATIONS COMPLETO
-- Com tabelas corretas: community_likes e community_comments
-- ========================================

-- 1. Garantir que todos os usuários tenham preferências padrão
INSERT INTO notification_preferences (user_id, push_notifications, community_notifications)
SELECT id, true, true
FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

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
  FOR v_member IN
    SELECT DISTINCT cm.aluno_id
    FROM community_members cm
    WHERE cm.community_id = p_community_id
      AND cm.aluno_id != p_author_id
  LOOP
    SELECT * INTO v_pref
    FROM notification_preferences
    WHERE user_id = v_member.aluno_id;

    IF v_pref IS NOT NULL AND v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        read,
        link,
        data
      )
      VALUES (
        v_member.aluno_id,
        '📱 Novo post em ' || COALESCE(p_community_name, 'comunidade'),
        COALESCE(p_author_name, 'Alguém') || ' publicou: ' || LEFT(p_content, 100),
        'new_post',
        false,
        '/aluno/comunidade?post=' || p_post_id,
        jsonb_build_object(
          'post_id', p_post_id,
          'community_id', p_community_id
        )
      );

      RAISE NOTICE 'Notificação criada para usuário %', v_member.aluno_id;
    ELSE
      RAISE NOTICE 'Usuário % não tem preferências ou push desabilitado', v_member.aluno_id;
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar membros: %', SQLERRM;
END;
$$;

-- 3. Trigger para novos posts
CREATE OR REPLACE FUNCTION trigger_notify_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_author_name TEXT;
  v_community_name TEXT;
BEGIN
  SELECT full_name INTO v_author_name
  FROM profiles
  WHERE id = NEW.author_id;

  SELECT name INTO v_community_name
  FROM communities
  WHERE id = NEW.community_id;

  RAISE NOTICE 'Trigger disparado para post % na comunidade %', NEW.id, v_community_name;

  PERFORM notify_community_post(
    NEW.community_id,
    NEW.author_id,
    v_author_name,
    v_community_name,
    NEW.content,
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro no trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_community_post ON community_posts;
CREATE TRIGGER trigger_new_community_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_post();

-- 4. Trigger para curtidas
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
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_pref
  FROM notification_preferences
  WHERE user_id = v_post_author_id;

  IF v_pref IS NOT NULL AND v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
    SELECT full_name INTO v_liker_name
    FROM profiles
    WHERE id = NEW.user_id;

    INSERT INTO notifications (user_id, title, message, type, read, link, data)
    VALUES (
      v_post_author_id,
      '❤️ Curtida em seu post',
      COALESCE(v_liker_name, 'Alguém') || ' curtiu seu post',
      'like',
      false,
      '/aluno/comunidade?post=' || NEW.post_id,
      jsonb_build_object('post_id', NEW.post_id)
    );

    RAISE NOTICE 'Notificação de curtida criada para usuário %', v_post_author_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar curtida: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_post_like ON community_likes;
CREATE TRIGGER trigger_new_post_like
  AFTER INSERT ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_like();

-- 5. Trigger para comentários
CREATE OR REPLACE FUNCTION trigger_notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commenter_name TEXT;
  v_post_author_id UUID;
  v_pref RECORD;
  v_comment_text TEXT;
BEGIN
  SELECT author_id INTO v_post_author_id
  FROM community_posts
  WHERE id = NEW.post_id;

  IF v_post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_pref
  FROM notification_preferences
  WHERE user_id = v_post_author_id;

  IF v_pref IS NOT NULL AND v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
    SELECT full_name INTO v_commenter_name
    FROM profiles
    WHERE id = NEW.author_id;

    -- Usar a coluna 'comment' ao invés de 'content'
    v_comment_text := COALESCE(NEW.comment, '');

    INSERT INTO notifications (user_id, title, message, type, read, link, data)
    VALUES (
      v_post_author_id,
      '💬 Novo comentário',
      COALESCE(v_commenter_name, 'Alguém') || ' comentou: ' || LEFT(v_comment_text, 100),
      'comment',
      false,
      '/aluno/comunidade?post=' || NEW.post_id,
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id
      )
    );

    RAISE NOTICE 'Notificação de comentário criada para usuário %', v_post_author_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar comentário: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_post_comment ON community_comments;
CREATE TRIGGER trigger_new_post_comment
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_comment();

-- 6. Verificar estrutura de community_comments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'community_comments'
ORDER BY ordinal_position;

-- 7. Verificar triggers criados
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_new_community_post',
  'trigger_new_post_like',
  'trigger_new_post_comment'
)
ORDER BY trigger_name;

-- 8. Verificar últimas notificações criadas
SELECT
  n.id,
  n.user_id,
  p.full_name as user_name,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;
