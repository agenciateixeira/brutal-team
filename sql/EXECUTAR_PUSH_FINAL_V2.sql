-- ========================================
-- PUSH NOTIFICATIONS PARA COMUNIDADE - FINAL V2
-- Adaptado para estrutura existente
-- Detecta automaticamente tabelas de likes e comentários
-- ========================================

-- 1. Função para notificar membros da comunidade
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

    IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
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
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar membros: %', SQLERRM;
END;
$$;

-- 2. Trigger para novos posts
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

-- 3. Trigger para curtidas (detecta tabela automaticamente)
DO $$
DECLARE
  v_table_name TEXT;
BEGIN
  -- Procurar tabela de likes
  SELECT table_name INTO v_table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%like%'
    AND table_name LIKE '%post%'
  LIMIT 1;

  IF v_table_name IS NOT NULL THEN
    RAISE NOTICE 'Tabela de likes encontrada: %', v_table_name;

    -- Criar função de notificação de curtida
    EXECUTE format('
      CREATE OR REPLACE FUNCTION trigger_notify_post_like()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
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

        IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
          SELECT full_name INTO v_liker_name
          FROM profiles
          WHERE id = NEW.user_id;

          INSERT INTO notifications (user_id, title, message, type, read, link, data)
          VALUES (
            v_post_author_id,
            ''❤️ Curtida em seu post'',
            COALESCE(v_liker_name, ''Alguém'') || '' curtiu seu post'',
            ''like'',
            false,
            ''/aluno/comunidade?post='' || NEW.post_id,
            jsonb_build_object(''post_id'', NEW.post_id)
          );
        END IF;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING ''Erro ao notificar curtida: %%'', SQLERRM;
          RETURN NEW;
      END;
      $func$;
    ');

    -- Criar trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_new_post_like ON %I', v_table_name);
    EXECUTE format('
      CREATE TRIGGER trigger_new_post_like
        AFTER INSERT ON %I
        FOR EACH ROW
        EXECUTE FUNCTION trigger_notify_post_like()
    ', v_table_name);

    RAISE NOTICE 'Trigger de curtidas criado em %', v_table_name;
  ELSE
    RAISE NOTICE 'Tabela de likes não encontrada';
  END IF;
END $$;

-- 4. Trigger para comentários (detecta tabela automaticamente)
DO $$
DECLARE
  v_table_name TEXT;
BEGIN
  -- Procurar tabela de comentários
  SELECT table_name INTO v_table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%comment%'
    AND table_name LIKE '%post%'
  LIMIT 1;

  IF v_table_name IS NOT NULL THEN
    RAISE NOTICE 'Tabela de comentários encontrada: %', v_table_name;

    -- Criar função de notificação de comentário
    EXECUTE format('
      CREATE OR REPLACE FUNCTION trigger_notify_post_comment()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        v_commenter_name TEXT;
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

        IF v_pref.push_notifications IS TRUE AND v_pref.community_notifications IS TRUE THEN
          SELECT full_name INTO v_commenter_name
          FROM profiles
          WHERE id = NEW.user_id;

          INSERT INTO notifications (user_id, title, message, type, read, link, data)
          VALUES (
            v_post_author_id,
            ''💬 Novo comentário'',
            COALESCE(v_commenter_name, ''Alguém'') || '' comentou: '' || LEFT(NEW.content, 100),
            ''comment'',
            false,
            ''/aluno/comunidade?post='' || NEW.post_id,
            jsonb_build_object(
              ''post_id'', NEW.post_id,
              ''comment_id'', NEW.id
            )
          );
        END IF;

        RETURN NEW;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING ''Erro ao notificar comentário: %%'', SQLERRM;
          RETURN NEW;
      END;
      $func$;
    ');

    -- Criar trigger
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_new_post_comment ON %I', v_table_name);
    EXECUTE format('
      CREATE TRIGGER trigger_new_post_comment
        AFTER INSERT ON %I
        FOR EACH ROW
        EXECUTE FUNCTION trigger_notify_post_comment()
    ', v_table_name);

    RAISE NOTICE 'Trigger de comentários criado em %', v_table_name;
  ELSE
    RAISE NOTICE 'Tabela de comentários não encontrada - trigger não criado';
  END IF;
END $$;

-- 5. Verificar o que foi criado
SELECT 'Triggers criados com sucesso!' as status;

SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_new_community_post',
  'trigger_new_post_like',
  'trigger_new_post_comment'
)
ORDER BY trigger_name;
