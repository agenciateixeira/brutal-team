-- ============================================
-- SISTEMA DE PRIMEIRO ACESSO
-- Upload obrigatório de 3 fotos + modal de boas-vindas
-- ============================================

-- Adicionar campos ao profiles para primeiro acesso
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_access_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_access_photos_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_access_at TIMESTAMP WITH TIME ZONE;

-- Tabela de fotos do primeiro acesso
CREATE TABLE IF NOT EXISTS first_access_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- URLs das fotos
  front_photo_url TEXT NOT NULL,
  side_photo_url TEXT NOT NULL,
  back_photo_url TEXT NOT NULL,

  -- Metadados
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para marcar primeiro acesso como completo
CREATE OR REPLACE FUNCTION complete_first_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando o aluno faz upload das 3 fotos, marcar como completo
  UPDATE profiles
  SET
    first_access_photos_uploaded = TRUE,
    first_access_completed = TRUE,
    first_access_at = NOW()
  WHERE id = NEW.aluno_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_complete_first_access
  AFTER INSERT ON first_access_photos
  FOR EACH ROW
  EXECUTE FUNCTION complete_first_access();

-- Índices
CREATE INDEX idx_first_access_photos_aluno ON first_access_photos(aluno_id);

-- RLS
ALTER TABLE first_access_photos ENABLE ROW LEVEL SECURITY;

-- Alunos podem ver e criar apenas suas próprias fotos
CREATE POLICY "Alunos podem ver suas próprias fotos de primeiro acesso"
  ON first_access_photos FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem fazer upload de fotos de primeiro acesso"
  ON first_access_photos FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

-- Coaches e admins podem ver todas
CREATE POLICY "Coaches podem ver todas as fotos de primeiro acesso"
  ON first_access_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- ✅ Sistema de primeiro acesso criado!
