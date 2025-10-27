-- ============================================
-- SETUP COMPLETO DO NOVO SISTEMA
-- Execute este arquivo inteiro no Supabase SQL Editor
-- ============================================

-- 1. SISTEMA DE ANAMNESE/QUESTIONÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS anamnese_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temp_email VARCHAR(255) UNIQUE,
  nome_completo TEXT,
  idade INTEGER,
  altura DECIMAL(5,2),
  peso DECIMAL(5,2),
  cintura DECIMAL(5,2),
  braco DECIMAL(5,2),
  perna DECIMAL(5,2),
  profissao TEXT,
  rotina_trabalho TEXT,
  estuda BOOLEAN,
  horarios_estudo TEXT,
  pratica_atividade_fisica BOOLEAN,
  modalidades_exercicio TEXT,
  dias_horarios_atividade TEXT,
  horarios_sono TEXT,
  trajetoria_objetivos TEXT,
  mudancas_esperadas TEXT,
  resultado_estetico_final TEXT,
  tempo_treino_continuo TEXT,
  resultados_estagnados BOOLEAN,
  percepcao_pump TEXT,
  uso_esteroides BOOLEAN,
  quais_esteroides TEXT,
  outras_substancias TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnese_temp_email ON anamnese_responses(temp_email);
ALTER TABLE anamnese_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode criar respostas de anamnese" ON anamnese_responses;
CREATE POLICY "Qualquer um pode criar respostas de anamnese"
  ON anamnese_responses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem ver suas próprias respostas" ON anamnese_responses;
CREATE POLICY "Usuários podem ver suas próprias respostas"
  ON anamnese_responses FOR SELECT
  USING (
    temp_email = auth.jwt()->>'email'
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 2. SISTEMA DE CÓDIGOS E PLANOS
-- ============================================

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('mensal', 'semestral', 'anual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  code VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 28),
  next_due_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para gerar código
CREATE OR REPLACE FUNCTION generate_unique_access_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM access_codes WHERE code = new_code) INTO code_exists;
    IF NOT code_exists THEN RETURN new_code; END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar código ao aprovar
CREATE OR REPLACE FUNCTION create_access_code_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
    INSERT INTO access_codes (aluno_id, code)
    VALUES (NEW.id, generate_unique_access_code())
    ON CONFLICT (aluno_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_access_code ON profiles;
CREATE TRIGGER trigger_create_access_code
  AFTER UPDATE OF approved ON profiles
  FOR EACH ROW WHEN (NEW.role = 'aluno')
  EXECUTE FUNCTION create_access_code_on_approval();

CREATE INDEX IF NOT EXISTS idx_access_codes_aluno ON access_codes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_plans_aluno ON student_plans(aluno_id);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos veem seu código" ON access_codes;
CREATE POLICY "Alunos veem seu código" ON access_codes FOR SELECT USING (aluno_id = auth.uid());

DROP POLICY IF EXISTS "Coaches veem todos códigos" ON access_codes;
CREATE POLICY "Coaches veem todos códigos" ON access_codes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

DROP POLICY IF EXISTS "Admins gerenciam códigos" ON access_codes;
CREATE POLICY "Admins gerenciam códigos" ON access_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Alunos veem seu plano" ON student_plans;
CREATE POLICY "Alunos veem seu plano" ON student_plans FOR SELECT USING (aluno_id = auth.uid());

DROP POLICY IF EXISTS "Coaches veem todos planos" ON student_plans;
CREATE POLICY "Coaches veem todos planos" ON student_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

DROP POLICY IF EXISTS "Coaches gerenciam planos" ON student_plans;
CREATE POLICY "Coaches gerenciam planos" ON student_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

-- 3. PRIMEIRO ACESSO
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_access_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_access_photos_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_access_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS first_access_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  front_photo_url TEXT NOT NULL,
  side_photo_url TEXT NOT NULL,
  back_photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION complete_first_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    first_access_photos_uploaded = TRUE,
    first_access_completed = TRUE,
    first_access_at = NOW()
  WHERE id = NEW.aluno_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_complete_first_access ON first_access_photos;
CREATE TRIGGER trigger_complete_first_access
  AFTER INSERT ON first_access_photos
  FOR EACH ROW EXECUTE FUNCTION complete_first_access();

ALTER TABLE first_access_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos veem suas fotos" ON first_access_photos;
CREATE POLICY "Alunos veem suas fotos" ON first_access_photos FOR SELECT USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Alunos fazem upload" ON first_access_photos;
CREATE POLICY "Alunos fazem upload" ON first_access_photos FOR INSERT WITH CHECK (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Coaches veem todas" ON first_access_photos;
CREATE POLICY "Coaches veem todas" ON first_access_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

-- 4. NOVO RESUMO SEMANAL
-- ============================================

DROP TABLE IF EXISTS weekly_summary CASCADE;

CREATE TABLE weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_of_month INTEGER NOT NULL CHECK (week_of_month BETWEEN 1 AND 4),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  waist_measurement DECIMAL(5,2),
  chest_measurement DECIMAL(5,2),
  arm_measurement DECIMAL(5,2),
  leg_measurement DECIMAL(5,2),
  seguiu_dieta BOOLEAN NOT NULL,
  problema_refeicao TEXT,
  consumo_agua_sim VARCHAR(20),
  qualidade_sono_sim VARCHAR(20),
  dia_nao_seguiu TEXT,
  refeicoes_fora_casa INTEGER DEFAULT 0,
  consumo_agua_nao VARCHAR(20),
  qualidade_sono_nao VARCHAR(20),
  faltou_treino BOOLEAN NOT NULL,
  quantos_dias_faltou INTEGER,
  desempenho_treino VARCHAR(20),
  horario_treino_proxima_semana TIME,
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  coach_feedback TEXT,
  coach_feedback_sent_at TIMESTAMP WITH TIME ZONE,
  feedback_viewed_by_aluno BOOLEAN DEFAULT FALSE,
  viewed_by_coach BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  task_completed BOOLEAN DEFAULT FALSE,
  task_completed_at TIMESTAMP WITH TIME ZONE,
  submission_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aluno_id, week_of_month, month, year)
);

CREATE OR REPLACE FUNCTION get_current_week_of_month()
RETURNS INTEGER AS $$
DECLARE
  day_of_month INTEGER;
BEGIN
  day_of_month := EXTRACT(DAY FROM CURRENT_DATE);
  IF day_of_month <= 7 THEN RETURN 1;
  ELSIF day_of_month <= 14 THEN RETURN 2;
  ELSIF day_of_month <= 21 THEN RETURN 3;
  ELSE RETURN 4;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_submission_order()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(submission_order), 0) + 1
  INTO NEW.submission_order
  FROM weekly_summary WHERE task_completed = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_submission_order ON weekly_summary;
CREATE TRIGGER trigger_set_submission_order
  BEFORE INSERT ON weekly_summary
  FOR EACH ROW EXECUTE FUNCTION set_submission_order();

CREATE INDEX IF NOT EXISTS idx_weekly_summary_aluno ON weekly_summary(aluno_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summary_order ON weekly_summary(submission_order);

ALTER TABLE weekly_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos veem seus resumos" ON weekly_summary;
CREATE POLICY "Alunos veem seus resumos" ON weekly_summary FOR SELECT USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Alunos criam resumos" ON weekly_summary;
CREATE POLICY "Alunos criam resumos" ON weekly_summary FOR INSERT WITH CHECK (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Alunos atualizam resumos" ON weekly_summary;
CREATE POLICY "Alunos atualizam resumos" ON weekly_summary FOR UPDATE USING (auth.uid() = aluno_id);

DROP POLICY IF EXISTS "Coaches veem todos resumos" ON weekly_summary;
CREATE POLICY "Coaches veem todos resumos" ON weekly_summary FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

DROP POLICY IF EXISTS "Coaches atualizam resumos" ON weekly_summary;
CREATE POLICY "Coaches atualizam resumos" ON weekly_summary FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')));

-- ✅ SETUP COMPLETO!
SELECT 'Sistema instalado com sucesso!' as status;
