-- ============================================
-- TABELA DE ATUALIZAÇÕES SEMANAIS
-- Para os alunos enviarem resumos semanais
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- Semana do ano (1-52)
  year INTEGER NOT NULL, -- Ano

  -- Dados enviados pelo aluno
  weight DECIMAL(5,2), -- Peso em kg
  body_fat_percentage DECIMAL(4,2), -- % gordura corporal
  muscle_mass DECIMAL(5,2), -- Massa muscular em kg
  waist_measurement DECIMAL(5,2), -- Cintura em cm
  chest_measurement DECIMAL(5,2), -- Peito em cm
  arm_measurement DECIMAL(5,2), -- Braço em cm
  leg_measurement DECIMAL(5,2), -- Perna em cm

  notes TEXT, -- Observações do aluno
  mood VARCHAR(50), -- Como se sente (great, good, ok, bad)
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5), -- Nível de energia 1-5
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5), -- Qualidade do sono 1-5

  -- Fotos de progresso IDs (opcional, pode referenciar progress_photos)
  front_photo_id UUID REFERENCES progress_photos(id),
  side_photo_id UUID REFERENCES progress_photos(id),
  back_photo_id UUID REFERENCES progress_photos(id),

  -- Status de visualização pelo coach
  viewed_by_coach BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint única para aluno + semana + ano
  UNIQUE(aluno_id, week_number, year)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_weekly_updates_aluno_id ON weekly_updates(aluno_id);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_viewed ON weekly_updates(viewed_by_coach);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_created_at ON weekly_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_week_year ON weekly_updates(week_number, year);

-- RLS Policies
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;

-- Alunos podem ver e criar apenas seus próprios resumos
CREATE POLICY "Alunos podem ver seus próprios resumos semanais"
  ON weekly_updates FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem criar seus resumos semanais"
  ON weekly_updates FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar seus resumos semanais"
  ON weekly_updates FOR UPDATE
  USING (auth.uid() = aluno_id);

-- Coaches podem ver todos os resumos
CREATE POLICY "Coaches podem ver todos os resumos semanais"
  ON weekly_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Coaches podem marcar como visualizado
CREATE POLICY "Coaches podem marcar resumos como visualizados"
  ON weekly_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_weekly_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_weekly_updates_updated_at ON weekly_updates;

CREATE TRIGGER trigger_update_weekly_updates_updated_at
  BEFORE UPDATE ON weekly_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_updates_updated_at();

-- Função para obter número de atualizações pendentes
CREATE OR REPLACE FUNCTION get_pending_weekly_updates_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM weekly_updates
    WHERE viewed_by_coach = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_updates;

-- Comentários
COMMENT ON TABLE weekly_updates IS 'Resumos semanais enviados pelos alunos com medidas e progresso';
COMMENT ON COLUMN weekly_updates.viewed_by_coach IS 'Indica se o coach já visualizou este resumo';
COMMENT ON FUNCTION get_pending_weekly_updates_count IS 'Retorna quantidade de resumos semanais não visualizados';

-- ✅ Tabela de atualizações semanais criada!
