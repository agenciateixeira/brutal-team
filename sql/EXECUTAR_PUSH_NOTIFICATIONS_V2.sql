-- ========================================
-- PUSH NOTIFICATIONS PARA COMUNIDADE - V2
-- Execute este SQL no Supabase Dashboard
-- VERSÃO CORRIGIDA para tabela notifications existente
-- ========================================

-- 1. Adicionar colunas necessárias na tabela notifications (se não existirem)
DO $$
BEGIN
  -- Adicionar is_read
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type TEXT;
  END IF;

  -- Adicionar data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'data'
  ) THEN
    ALTER TABLE notifications ADD COLUMN data JSONB;
  END IF;

  -- Adicionar body
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'body'
  ) THEN
    ALTER TABLE notifications ADD COLUMN body TEXT;
  END IF;
END $$;

-- 2. Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Função para notificar membros da comunidade
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
EXCEPTION
  WHEN OTHERS THEN
    -- Não falhar se houver erro, apenas logar
    RAISE WARNING 'Erro ao notificar membros: %', SQLERRM;
END;
$$;

-- 4. Trigger para novos posts na comunidade
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

  -- Notificar membros (async, não bloqueia)
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
    -- Não falhar o insert do post se notificação falhar
    RAISE WARNING 'Erro no trigger de notificação: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_community_post ON community_posts;
CREATE TRIGGER trigger_new_community_post
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_post();

-- 5. Trigger para curtidas em posts
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar curtida: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_new_post_like ON post_likes;
CREATE TRIGGER trigger_new_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_post_like();

-- 6. Trigger para comentários em posts
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar comentário: %', SQLERRM;
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
-- 1. Adicionar colunas necessárias na tabela existente
-- 2. Criar notificações automáticas
-- 3. Respeitar preferências de cada usuário
-- 4. Funcionar para posts, curtidas e comentários
-- 5. Não falhar se houver erros (usa EXCEPTION)
-- ========================================

-- Verificar se tudo foi criado corretamente
SELECT 'Tabela notifications' as objeto, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

SELECT 'Triggers criados' as status,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_new_community_post',
  'trigger_new_post_like',
  'trigger_new_post_comment'
);
