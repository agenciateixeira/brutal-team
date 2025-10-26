-- ============================================
-- SISTEMA DE NOTIFICAÇÕES - VERSÃO SIMPLIFICADA
-- Apenas para dietas e treinos (protocolos virá depois)
-- ============================================

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_id UUID,
  icon VARCHAR(50)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, read) WHERE read = FALSE;

-- 3. Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- 5. Criar policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 6. Remover funções e triggers antigos
DROP TRIGGER IF EXISTS dieta_activated_trigger ON dietas;
DROP TRIGGER IF EXISTS treino_activated_trigger ON treinos;

DROP FUNCTION IF EXISTS notify_dieta_activated();
DROP FUNCTION IF EXISTS notify_treino_activated();

-- 7. Criar função para notificar dieta
CREATE OR REPLACE FUNCTION notify_dieta_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

    INSERT INTO notifications (user_id, type, title, message, link, related_id, icon)
    VALUES (
      NEW.aluno_id,
      'dieta',
      'Nova dieta disponível!',
      'Seu coach atualizou sua dieta: ' || NEW.title,
      '/aluno/dieta',
      NEW.id,
      'Apple'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar função para notificar treino
CREATE OR REPLACE FUNCTION notify_treino_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN

    INSERT INTO notifications (user_id, type, title, message, link, related_id, icon)
    VALUES (
      NEW.aluno_id,
      'treino',
      'Novo treino disponível!',
      'Seu coach atualizou seu treino: ' || NEW.title,
      '/aluno/treino',
      NEW.id,
      'Dumbbell'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar triggers
CREATE TRIGGER dieta_activated_trigger
  AFTER INSERT OR UPDATE OF active ON dietas
  FOR EACH ROW
  EXECUTE FUNCTION notify_dieta_activated();

CREATE TRIGGER treino_activated_trigger
  AFTER INSERT OR UPDATE OF active ON treinos
  FOR EACH ROW
  EXECUTE FUNCTION notify_treino_activated();

-- ✅ Setup completo!
-- Agora as notificações serão criadas automaticamente quando coach ativar dieta/treino
