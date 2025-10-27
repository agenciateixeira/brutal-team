-- ============================================
-- SISTEMA DE ANAMNESE E QUESTIONÁRIO
-- Questionário antes do cadastro
-- ============================================

-- Tabela de respostas do questionário/anamnese
CREATE TABLE IF NOT EXISTS anamnese_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação temporária (antes do cadastro)
  temp_email VARCHAR(255) UNIQUE,

  -- INFORMAÇÕES GERAIS
  nome_completo TEXT,
  idade INTEGER,
  altura DECIMAL(5,2), -- em cm
  peso DECIMAL(5,2), -- em kg
  cintura DECIMAL(5,2), -- em cm
  braco DECIMAL(5,2), -- em cm
  perna DECIMAL(5,2), -- em cm

  -- ROTINA
  profissao TEXT,
  rotina_trabalho TEXT,
  estuda BOOLEAN,
  horarios_estudo TEXT,
  pratica_atividade_fisica BOOLEAN,
  modalidades_exercicio TEXT,
  dias_horarios_atividade TEXT,
  horarios_sono TEXT,

  -- OBJETIVOS
  trajetoria_objetivos TEXT,
  mudancas_esperadas TEXT,
  resultado_estetico_final TEXT,

  -- TREINAMENTO
  tempo_treino_continuo TEXT,
  resultados_estagnados BOOLEAN,
  percepcao_pump TEXT,

  -- USO DE SUBSTÂNCIAS
  uso_esteroides BOOLEAN,
  quais_esteroides TEXT,
  outras_substancias TEXT,

  -- Metadados
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_anamnese_temp_email ON anamnese_responses(temp_email);
CREATE INDEX idx_anamnese_completed ON anamnese_responses(completed);

-- RLS
ALTER TABLE anamnese_responses ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode criar (questionário público)
CREATE POLICY "Qualquer um pode criar respostas de anamnese"
  ON anamnese_responses FOR INSERT
  WITH CHECK (true);

-- Apenas o próprio usuário ou admin pode ver
CREATE POLICY "Usuários podem ver suas próprias respostas"
  ON anamnese_responses FOR SELECT
  USING (
    temp_email = auth.jwt()->>'email'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_anamnese_updated_at
  BEFORE UPDATE ON anamnese_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Tabela de anamnese criada!
