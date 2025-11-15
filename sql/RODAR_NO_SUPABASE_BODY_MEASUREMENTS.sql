-- =====================================================
-- 📊 ETAPA 2: Evolução Física - Medidas Corporais
-- =====================================================
--
-- Cria tabela para armazenar histórico de:
-- - Peso
-- - Medidas corporais (cintura, braço, perna, etc)
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em: Database → SQL Editor
-- 3. Cole TODO este código
-- 4. Clique em "Run"
--
-- =====================================================

-- =====================================================
-- TABELA: body_measurements
-- =====================================================

CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Peso em kg
  weight DECIMAL(5,2),

  -- Medidas em cm
  neck DECIMAL(5,2),          -- Pescoço
  chest DECIMAL(5,2),         -- Peito
  waist DECIMAL(5,2),         -- Cintura
  hips DECIMAL(5,2),          -- Quadril
  left_arm DECIMAL(5,2),      -- Braço esquerdo
  right_arm DECIMAL(5,2),     -- Braço direito
  left_forearm DECIMAL(5,2),  -- Antebraço esquerdo
  right_forearm DECIMAL(5,2), -- Antebraço direito
  left_thigh DECIMAL(5,2),    -- Coxa esquerda
  right_thigh DECIMAL(5,2),   -- Coxa direita
  left_calf DECIMAL(5,2),     -- Panturrilha esquerda
  right_calf DECIMAL(5,2),    -- Panturrilha direita

  -- Observações opcionais
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_body_measurements_aluno
  ON body_measurements(aluno_id);

CREATE INDEX IF NOT EXISTS idx_body_measurements_date
  ON body_measurements(aluno_id, measured_at DESC);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver suas medidas" ON body_measurements;
DROP POLICY IF EXISTS "Alunos podem inserir suas medidas" ON body_measurements;
DROP POLICY IF EXISTS "Alunos podem atualizar suas medidas" ON body_measurements;
DROP POLICY IF EXISTS "Alunos podem deletar suas medidas" ON body_measurements;
DROP POLICY IF EXISTS "Coaches podem ver medidas dos alunos" ON body_measurements;

-- Criar policies
CREATE POLICY "Alunos podem ver suas medidas"
  ON body_measurements FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem inserir suas medidas"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar suas medidas"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem deletar suas medidas"
  ON body_measurements FOR DELETE
  USING (auth.uid() = aluno_id);

CREATE POLICY "Coaches podem ver medidas dos alunos"
  ON body_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- =====================================================
-- FUNÇÃO: Atualizar timestamp automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_body_measurements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_body_measurements_timestamp ON body_measurements;

-- Criar trigger
CREATE TRIGGER trigger_update_body_measurements_timestamp
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_body_measurements_timestamp();

-- =====================================================
-- PRONTO PARA USO!
-- =====================================================
--
-- A tabela está criada e pronta para receber medições.
-- Os alunos podem começar a registrar peso e medidas corporais.
--

-- =====================================================
-- ✅ PRONTO!
-- =====================================================
--
-- Tabela criada com sucesso!
--
-- Agora os alunos podem:
-- - Registrar peso e medidas corporais
-- - Ver histórico em gráficos
-- - Acompanhar evolução ao longo do tempo
--
-- =====================================================
