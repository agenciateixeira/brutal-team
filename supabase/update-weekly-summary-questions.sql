-- ============================================
-- ATUALIZAR RESUMO SEMANAL COM NOVAS PERGUNTAS
-- Perguntas condicionais e feedback do coach
-- ============================================

-- Remover tabela antiga se existir e criar nova versão
DROP TABLE IF EXISTS weekly_summary CASCADE;

CREATE TABLE weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Semana e mês
  week_of_month INTEGER NOT NULL CHECK (week_of_month BETWEEN 1 AND 4), -- 1ª, 2ª, 3ª, 4ª semana
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,

  -- MEDIDAS
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  waist_measurement DECIMAL(5,2),
  chest_measurement DECIMAL(5,2),
  arm_measurement DECIMAL(5,2),
  leg_measurement DECIMAL(5,2),

  -- PERGUNTA 1: SEGUIU A DIETA?
  seguiu_dieta BOOLEAN NOT NULL,

  -- RESPOSTAS SE "SIM"
  problema_refeicao TEXT, -- Pergunta A
  consumo_agua_sim VARCHAR(20), -- Pergunta B: '1-2L', '3L+', '<1L'
  qualidade_sono_sim VARCHAR(20), -- Pergunta C: 'ruim', 'media', 'boa', 'excelente'

  -- RESPOSTAS SE "NÃO"
  dia_nao_seguiu TEXT, -- Pergunta D
  refeicoes_fora_casa INTEGER DEFAULT 0, -- Pergunta E
  consumo_agua_nao VARCHAR(20), -- Pergunta F
  qualidade_sono_nao VARCHAR(20), -- Pergunta G

  -- PERGUNTA 2: FALTOU EM ALGUM DIA DE TREINO?
  faltou_treino BOOLEAN NOT NULL,
  quantos_dias_faltou INTEGER,

  -- PERGUNTAS GERAIS
  desempenho_treino VARCHAR(20), -- Pergunta H: 'queda', 'estagnacao', 'melhora'
  horario_treino_proxima_semana TIME, -- Pergunta I

  -- FOTOS DE PROGRESSO
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,

  -- FEEDBACK DO COACH
  coach_feedback TEXT,
  coach_feedback_sent_at TIMESTAMP WITH TIME ZONE,
  feedback_viewed_by_aluno BOOLEAN DEFAULT FALSE,

  -- STATUS
  viewed_by_coach BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  task_completed BOOLEAN DEFAULT FALSE, -- Coach marcou como concluído
  task_completed_at TIMESTAMP WITH TIME ZONE,

  -- ORDEM CRONOLÓGICA
  submission_order INTEGER, -- Para manter ordem de quem enviou primeiro

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint única para aluno + semana + mês + ano
  UNIQUE(aluno_id, week_of_month, month, year)
);

-- Função para calcular qual semana do mês estamos
CREATE OR REPLACE FUNCTION get_current_week_of_month()
RETURNS INTEGER AS $$
DECLARE
  day_of_month INTEGER;
BEGIN
  day_of_month := EXTRACT(DAY FROM CURRENT_DATE);

  IF day_of_month <= 7 THEN
    RETURN 1;
  ELSIF day_of_month <= 14 THEN
    RETURN 2;
  ELSIF day_of_month <= 21 THEN
    RETURN 3;
  ELSE
    RETURN 4;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para definir ordem de submissão automaticamente
CREATE OR REPLACE FUNCTION set_submission_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Pegar o próximo número da ordem baseado na quantidade de submissões pendentes
  SELECT COALESCE(MAX(submission_order), 0) + 1
  INTO NEW.submission_order
  FROM weekly_summary
  WHERE task_completed = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_submission_order
  BEFORE INSERT ON weekly_summary
  FOR EACH ROW
  EXECUTE FUNCTION set_submission_order();

-- Função para mover para o final da fila quando marcar como concluído
CREATE OR REPLACE FUNCTION reorder_on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_completed = TRUE AND OLD.task_completed = FALSE THEN
    -- Mover este para o final
    UPDATE weekly_summary
    SET submission_order = (
      SELECT COALESCE(MAX(submission_order), 0) + 1
      FROM weekly_summary
    )
    WHERE id = NEW.id;

    -- Reordenar os demais
    UPDATE weekly_summary
    SET submission_order = submission_order - 1
    WHERE submission_order > OLD.submission_order
      AND task_completed = FALSE
      AND id != NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reorder_on_complete
  AFTER UPDATE OF task_completed ON weekly_summary
  FOR EACH ROW
  EXECUTE FUNCTION reorder_on_task_complete();

-- Índices
CREATE INDEX idx_weekly_summary_aluno ON weekly_summary(aluno_id);
CREATE INDEX idx_weekly_summary_viewed ON weekly_summary(viewed_by_coach);
CREATE INDEX idx_weekly_summary_task ON weekly_summary(task_completed);
CREATE INDEX idx_weekly_summary_order ON weekly_summary(submission_order);
CREATE INDEX idx_weekly_summary_date ON weekly_summary(year DESC, month DESC, week_of_month DESC);

-- RLS
ALTER TABLE weekly_summary ENABLE ROW LEVEL SECURITY;

-- Alunos podem ver e criar apenas seus próprios resumos
CREATE POLICY "Alunos podem ver seus próprios resumos"
  ON weekly_summary FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem criar seus resumos"
  ON weekly_summary FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar seus resumos"
  ON weekly_summary FOR UPDATE
  USING (auth.uid() = aluno_id);

-- Coaches podem ver todos e adicionar feedback
CREATE POLICY "Coaches podem ver todos os resumos"
  ON weekly_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches podem atualizar resumos"
  ON weekly_summary FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_weekly_summary_updated_at
  BEFORE UPDATE ON weekly_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Sistema de resumo semanal atualizado!
