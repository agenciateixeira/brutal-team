-- ============================================
-- CRIAR TABELA DE PUSH SUBSCRIPTIONS
-- Execute este SQL no Supabase
-- ============================================

-- Tabela para armazenar inscrições de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados da subscription (do navigator.push.subscribe())
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Metadados
  user_agent TEXT,
  device_type VARCHAR(20), -- 'ios', 'android', 'desktop'
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Garantir que não haja duplicatas
  UNIQUE(user_id, endpoint)
);

-- Índices
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx ON push_subscriptions(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias subscriptions
CREATE POLICY "Users can create their own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias subscriptions
CREATE POLICY "Users can delete their own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Coaches e admins podem ver todas as subscriptions
CREATE POLICY "Coaches can view all subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Comentários
COMMENT ON TABLE push_subscriptions IS 'Armazena inscrições de push notifications dos usuários';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL do endpoint de push do navegador';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Chave pública para criptografia';
COMMENT ON COLUMN push_subscriptions.auth IS 'Chave de autenticação';
COMMENT ON COLUMN push_subscriptions.device_type IS 'Tipo de dispositivo: ios, android ou desktop';

-- ✅ Tabela criada com sucesso!
