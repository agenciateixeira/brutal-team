-- Função para criar notificação quando dieta é ativada
CREATE OR REPLACE FUNCTION notify_dieta_activated()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a dieta foi ativada (de false para true ou inserida como true)
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação quando treino é ativado
CREATE OR REPLACE FUNCTION notify_treino_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação quando protocolo é ativado
CREATE OR REPLACE FUNCTION notify_protocolo_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop triggers existentes (se houver)
DROP TRIGGER IF EXISTS dieta_activated_trigger ON dietas;
DROP TRIGGER IF EXISTS treino_activated_trigger ON treinos;
DROP TRIGGER IF EXISTS protocolo_activated_trigger ON protocolos;

-- Criar triggers
CREATE TRIGGER dieta_activated_trigger
  AFTER INSERT OR UPDATE OF active ON dietas
  FOR EACH ROW
  EXECUTE FUNCTION notify_dieta_activated();

CREATE TRIGGER treino_activated_trigger
  AFTER INSERT OR UPDATE OF active ON treinos
  FOR EACH ROW
  EXECUTE FUNCTION notify_treino_activated();

CREATE TRIGGER protocolo_activated_trigger
  AFTER INSERT OR UPDATE OF active ON protocolos
  FOR EACH ROW
  EXECUTE FUNCTION notify_protocolo_activated();

-- Comentários
COMMENT ON FUNCTION notify_dieta_activated() IS 'Cria notificação quando dieta é ativada';
COMMENT ON FUNCTION notify_treino_activated() IS 'Cria notificação quando treino é ativado';
COMMENT ON FUNCTION notify_protocolo_activated() IS 'Cria notificação quando protocolo é ativado';
