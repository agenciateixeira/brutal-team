-- =====================================================
-- 🎮 GAMIFICAÇÃO - Versão 2 (Sem Erros)
-- =====================================================
--
-- Esta versão corrige os erros de "policy already exists"
-- e pode ser rodada mesmo que você já tenha tentado antes.
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em: Database → SQL Editor
-- 3. Cole TODO este código
-- 4. Clique em "Run"
--
-- =====================================================

-- =====================================================
-- TABELAS (DROP IF EXISTS para garantir)
-- =====================================================

-- Tabela de estatísticas diárias
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workouts_completed INT DEFAULT 0,
  workouts_planned INT DEFAULT 0,
  meals_completed INT DEFAULT 0,
  meals_planned INT DEFAULT 0,
  photos_uploaded INT DEFAULT 0,
  is_active_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aluno_id, date)
);

-- Tabela de achievements (conquistas)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de achievements desbloqueados
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aluno_id, achievement_id)
);

-- Tabela de estatísticas gerais do usuário
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  total_workouts INT DEFAULT 0,
  total_meals_completed INT DEFAULT 0,
  total_photos INT DEFAULT 0,
  total_active_days INT DEFAULT 0,
  current_month_workout_percentage DECIMAL(5,2) DEFAULT 0,
  current_month_meal_percentage DECIMAL(5,2) DEFAULT 0,
  current_week_photo_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_daily_stats_aluno_date ON daily_stats(aluno_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_aluno ON user_achievements(aluno_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_aluno ON user_stats(aluno_id);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver suas daily_stats" ON daily_stats;
DROP POLICY IF EXISTS "Alunos podem inserir suas daily_stats" ON daily_stats;
DROP POLICY IF EXISTS "Alunos podem atualizar suas daily_stats" ON daily_stats;
DROP POLICY IF EXISTS "Coaches podem ver daily_stats dos alunos" ON daily_stats;

DROP POLICY IF EXISTS "Todos podem ver achievements" ON achievements;

DROP POLICY IF EXISTS "Alunos podem ver seus achievements" ON user_achievements;
DROP POLICY IF EXISTS "Alunos podem inserir achievements" ON user_achievements;
DROP POLICY IF EXISTS "Coaches podem ver achievements dos alunos" ON user_achievements;

DROP POLICY IF EXISTS "Alunos podem ver suas stats" ON user_stats;
DROP POLICY IF EXISTS "Alunos podem inserir suas stats" ON user_stats;
DROP POLICY IF EXISTS "Alunos podem atualizar suas stats" ON user_stats;
DROP POLICY IF EXISTS "Coaches podem ver stats dos alunos" ON user_stats;

-- Criar policies novas
-- daily_stats
CREATE POLICY "Alunos podem ver suas daily_stats"
  ON daily_stats FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem inserir suas daily_stats"
  ON daily_stats FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar suas daily_stats"
  ON daily_stats FOR UPDATE
  USING (auth.uid() = aluno_id);

CREATE POLICY "Coaches podem ver daily_stats dos alunos"
  ON daily_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- achievements
CREATE POLICY "Todos podem ver achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- user_achievements
CREATE POLICY "Alunos podem ver seus achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem inserir achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Coaches podem ver achievements dos alunos"
  ON user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- user_stats
CREATE POLICY "Alunos podem ver suas stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem inserir suas stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem atualizar suas stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = aluno_id);

CREATE POLICY "Coaches podem ver stats dos alunos"
  ON user_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para calcular se o dia foi ativo (>= 70%)
CREATE OR REPLACE FUNCTION calculate_is_active_day()
RETURNS TRIGGER AS $$
DECLARE
  total_planned INT;
  total_completed INT;
  completion_rate DECIMAL;
BEGIN
  total_planned := NEW.workouts_planned + NEW.meals_planned;
  total_completed := NEW.workouts_completed + NEW.meals_completed;

  IF total_planned > 0 THEN
    completion_rate := (total_completed::DECIMAL / total_planned::DECIMAL) * 100;
    NEW.is_active_day := completion_rate >= 70;
  ELSE
    NEW.is_active_day := FALSE;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active_day = TRUE THEN
    INSERT INTO user_stats (aluno_id, current_streak, longest_streak, last_active_date, total_active_days)
    VALUES (
      NEW.aluno_id,
      1,
      1,
      NEW.date,
      1
    )
    ON CONFLICT (aluno_id) DO UPDATE SET
      current_streak = CASE
        WHEN user_stats.last_active_date = NEW.date - INTERVAL '1 day'
          THEN user_stats.current_streak + 1
        ELSE 1
      END,
      longest_streak = CASE
        WHEN user_stats.last_active_date = NEW.date - INTERVAL '1 day'
          AND user_stats.current_streak + 1 > user_stats.longest_streak
          THEN user_stats.current_streak + 1
        WHEN user_stats.last_active_date != NEW.date - INTERVAL '1 day'
          AND 1 > user_stats.longest_streak
          THEN 1
        ELSE user_stats.longest_streak
      END,
      last_active_date = NEW.date,
      total_active_days = user_stats.total_active_days + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_calculate_is_active_day ON daily_stats;
DROP TRIGGER IF EXISTS trigger_update_user_streak ON daily_stats;

-- Criar triggers
CREATE TRIGGER trigger_calculate_is_active_day
  BEFORE INSERT OR UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_is_active_day();

CREATE TRIGGER trigger_update_user_streak
  AFTER INSERT OR UPDATE ON daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- =====================================================
-- ACHIEVEMENTS PRÉ-CADASTRADOS
-- =====================================================

INSERT INTO achievements (code, name, description, icon, tier, criteria) VALUES
  ('first_day', 'Primeiro Dia', 'Completou seu primeiro dia de treino', '🎯', 'bronze', '{"type": "active_days", "count": 1}'),
  ('week_warrior', 'Guerreiro Semanal', '7 dias consecutivos de consistência', '🔥', 'silver', '{"type": "streak", "days": 7}'),
  ('two_weeks', 'Quinzena Brutal', '14 dias consecutivos', '💪', 'silver', '{"type": "streak", "days": 14}'),
  ('month_master', 'Mestre do Mês', '30 dias consecutivos', '🏆', 'gold', '{"type": "streak", "days": 30}'),
  ('century_club', 'Clube dos 100', '100 dias ativos (não consecutivos)', '💯', 'platinum', '{"type": "total_active_days", "count": 100}'),
  ('perfect_week', 'Semana Perfeita', '100% de conclusão em 7 dias', '⭐', 'gold', '{"type": "perfect_week", "days": 7}'),
  ('photo_starter', 'Documentando Evolução', 'Enviou 5 fotos de progresso', '📸', 'bronze', '{"type": "total_photos", "count": 5}'),
  ('photo_pro', 'Profissional da Evolução', 'Enviou 20 fotos de progresso', '📷', 'silver', '{"type": "total_photos", "count": 20}'),
  ('meal_discipline', 'Disciplina Alimentar', '100 refeições completadas', '🍽️', 'silver', '{"type": "total_meals", "count": 100}'),
  ('workout_beast', 'Fera dos Treinos', '50 treinos completados', '🦍', 'gold', '{"type": "total_workouts", "count": 50}')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CRIAR USER_STATS PARA ALUNOS EXISTENTES
-- =====================================================

INSERT INTO user_stats (aluno_id)
SELECT id FROM profiles WHERE role = 'aluno'
ON CONFLICT (aluno_id) DO NOTHING;

-- =====================================================
-- ✅ PRONTO!
-- =====================================================
--
-- Agora você pode testar a dashboard!
-- A dashboard já está com realtime, então quando você
-- atualizar os dados, ela vai atualizar automaticamente.
--
-- =====================================================
