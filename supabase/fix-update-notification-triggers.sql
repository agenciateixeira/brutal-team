-- ============================================
-- FIX: Atualizar triggers de notificação
-- Para também resetar viewed_by_aluno
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Função para criar notificação quando dieta é ativada ou atualizada
CREATE OR REPLACE FUNCTION notify_dieta_activated()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a dieta foi ativada (de false para true ou inserida como true)
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

    -- Resetar viewed_by_aluno para FALSE
    NEW.viewed_by_aluno := FALSE;

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
  END IF;

  -- Se a dieta foi atualizada (mesmo já sendo active)
  IF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND
     (OLD.content != NEW.content OR OLD.title != NEW.title) THEN

    -- Resetar viewed_by_aluno para FALSE
    NEW.viewed_by_aluno := FALSE;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação quando treino é ativado ou atualizado
CREATE OR REPLACE FUNCTION notify_treino_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

    -- Resetar viewed_by_aluno para FALSE
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
  END IF;

  -- Se o treino foi atualizado (mesmo já sendo active)
  IF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND
     (OLD.content != NEW.content OR OLD.title != NEW.title) THEN

    -- Resetar viewed_by_aluno para FALSE
    NEW.viewed_by_aluno := FALSE;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação quando protocolo é ativado ou atualizado
CREATE OR REPLACE FUNCTION notify_protocolo_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

    -- Resetar viewed_by_aluno para FALSE
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
  END IF;

  -- Se o protocolo foi atualizado (mesmo já sendo active)
  IF TG_OP = 'UPDATE' AND OLD.active = true AND NEW.active = true AND
     (OLD.content != NEW.content OR OLD.title != NEW.title) THEN

    -- Resetar viewed_by_aluno para FALSE
    NEW.viewed_by_aluno := FALSE;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop triggers existentes (se houver)
DROP TRIGGER IF EXISTS dieta_activated_trigger ON dietas;
DROP TRIGGER IF EXISTS treino_activated_trigger ON treinos;
DROP TRIGGER IF EXISTS protocolo_activated_trigger ON protocolos_hormonais;

-- Criar triggers - IMPORTANTE: usar BEFORE para poder modificar NEW
CREATE TRIGGER dieta_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON dietas
  FOR EACH ROW
  EXECUTE FUNCTION notify_dieta_activated();

CREATE TRIGGER treino_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON treinos
  FOR EACH ROW
  EXECUTE FUNCTION notify_treino_activated();

CREATE TRIGGER protocolo_activated_trigger
  BEFORE INSERT OR UPDATE OF active, content, title ON protocolos_hormonais
  FOR EACH ROW
  EXECUTE FUNCTION notify_protocolo_activated();

-- Comentários
COMMENT ON FUNCTION notify_dieta_activated() IS 'Cria notificação e reseta viewed_by_aluno quando dieta é ativada ou atualizada';
COMMENT ON FUNCTION notify_treino_activated() IS 'Cria notificação e reseta viewed_by_aluno quando treino é ativado ou atualizado';
COMMENT ON FUNCTION notify_protocolo_activated() IS 'Cria notificação e reseta viewed_by_aluno quando protocolo é ativado ou atualizado';

-- ✅ Triggers atualizados com sucesso!
-- Agora quando o coach ativar ou atualizar dieta/treino/protocolo:
-- 1. viewed_by_aluno será setado para FALSE automaticamente
-- 2. Uma notificação será criada na tabela notifications
-- 3. O aluno verá o badge de atualização no dashboard
