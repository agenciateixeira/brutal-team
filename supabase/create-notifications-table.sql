-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'dieta', 'treino', 'protocolo', 'mensagem', 'aviso'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- URL para onde a notificação leva
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata adicional
  related_id UUID, -- ID da dieta/treino/protocolo relacionado
  icon VARCHAR(50), -- Nome do ícone para exibir

  -- Índices para performance
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, read) WHERE read = FALSE;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode marcar suas notificações como lidas
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches podem criar notificações para seus alunos
CREATE POLICY "Coaches can create notifications for their students"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Sistema pode criar notificações (para triggers)
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE notifications IS 'Notificações do sistema para alunos e coaches';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: dieta, treino, protocolo, mensagem, aviso';
COMMENT ON COLUMN notifications.read IS 'Se a notificação foi lida';
COMMENT ON COLUMN notifications.related_id IS 'ID do recurso relacionado (dieta_id, treino_id, etc)';
