-- ============================================
-- COMPLEMENTO: SISTEMA DE ASSINATURAS ALUNO-COACH
-- ============================================
-- Adiciona tabelas e funcionalidades para assinaturas de alunos com coaches
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. TABELA DE PLANOS/PREÇOS DOS COACHES
-- ============================================
-- Cada coach pode criar seus próprios planos de preços
CREATE TABLE IF NOT EXISTS coach_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Coach dono do plano
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe
  stripe_price_id TEXT UNIQUE, -- Price ID no Stripe
  stripe_product_id TEXT, -- Product ID no Stripe

  -- Detalhes do plano
  name TEXT NOT NULL, -- ex: "Plano Mensal Personalizado"
  description TEXT,
  amount INTEGER NOT NULL, -- valor em centavos
  currency TEXT DEFAULT 'brl',
  interval TEXT DEFAULT 'month', -- 'day', 'week', 'month', 'year'
  interval_count INTEGER DEFAULT 1, -- cobrar a cada X intervalos

  -- Trial
  trial_period_days INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_currency CHECK (currency IN ('brl', 'usd')),
  CONSTRAINT valid_interval CHECK (interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT valid_interval_count CHECK (interval_count > 0)
);

-- Comentários
COMMENT ON TABLE coach_subscription_plans IS 'Planos de assinatura criados pelos coaches';
COMMENT ON COLUMN coach_subscription_plans.amount IS 'Valor em centavos (ex: 30000 = R$ 300,00)';
COMMENT ON COLUMN coach_subscription_plans.interval IS 'Frequência de cobrança: day, week, month, year';
COMMENT ON COLUMN coach_subscription_plans.trial_period_days IS 'Dias de período de teste grátis';

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_plans_coach ON coach_subscription_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_plans_active ON coach_subscription_plans(active);
CREATE INDEX IF NOT EXISTS idx_coach_plans_stripe_price ON coach_subscription_plans(stripe_price_id);

-- RLS
ALTER TABLE coach_subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active coach plans"
  ON coach_subscription_plans FOR SELECT
  USING (active = true);

CREATE POLICY "Coaches can manage their own plans"
  ON coach_subscription_plans FOR ALL
  USING (auth.uid() = coach_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coach_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coach_plans_updated_at
  BEFORE UPDATE ON coach_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_plans_updated_at();

-- ============================================
-- 2. ADICIONAR CAMPOS À TABELA SUBSCRIPTIONS
-- ============================================
-- Adicionar referência ao plano e informações de fee

-- Adicionar coluna de plano (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id UUID REFERENCES coach_subscription_plans(id) ON DELETE SET NULL;
    CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
  END IF;
END $$;

-- Adicionar colunas de fee da plataforma
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'platform_fee_percent'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN platform_fee_percent DECIMAL(5,2) DEFAULT 2.00;
    COMMENT ON COLUMN subscriptions.platform_fee_percent IS 'Porcentagem de fee da plataforma (padrão: 2%)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_price_id TEXT;
    CREATE INDEX idx_subscriptions_stripe_price ON subscriptions(stripe_price_id);
  END IF;
END $$;

-- ============================================
-- 3. TABELA DE RELACIONAMENTO COACH-ALUNO
-- ============================================
-- Mantém registro de todos os alunos de um coach (mesmo após cancelar assinatura)
CREATE TABLE IF NOT EXISTS coach_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Informações
  status TEXT DEFAULT 'active', -- active, inactive, blocked
  notes TEXT, -- notas do coach sobre o aluno

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ,

  -- Constraint: um aluno não pode aparecer 2x para o mesmo coach
  CONSTRAINT unique_coach_student UNIQUE (coach_id, student_id),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'blocked'))
);

-- Comentários
COMMENT ON TABLE coach_students IS 'Relacionamento entre coaches e alunos';
COMMENT ON COLUMN coach_students.status IS 'active: aluno ativo, inactive: sem assinatura, blocked: bloqueado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_students_coach ON coach_students(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_student ON coach_students(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_students_status ON coach_students(status);

-- RLS
ALTER TABLE coach_students ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Coaches can view their students"
  ON coach_students FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Students can view their coaches"
  ON coach_students FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Coaches can manage their students"
  ON coach_students FOR ALL
  USING (auth.uid() = coach_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coach_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coach_students_updated_at
  BEFORE UPDATE ON coach_students
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_students_updated_at();

-- ============================================
-- 4. FUNÇÕES ÚTEIS
-- ============================================

-- Função para criar relacionamento coach-aluno quando criar assinatura
CREATE OR REPLACE FUNCTION create_coach_student_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar relacionamento coach-aluno
  INSERT INTO coach_students (coach_id, student_id, status, last_interaction_at)
  VALUES (NEW.coach_id, NEW.aluno_id, 'active', NOW())
  ON CONFLICT (coach_id, student_id)
  DO UPDATE SET
    status = 'active',
    last_interaction_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: criar relacionamento ao criar assinatura
DROP TRIGGER IF EXISTS trigger_create_coach_student ON subscriptions;
CREATE TRIGGER trigger_create_coach_student
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_coach_student_on_subscription();

-- Função para atualizar status do aluno quando assinatura cancelar
CREATE OR REPLACE FUNCTION update_student_status_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Se assinatura foi cancelada, atualizar status do aluno para inactive
  IF NEW.status IN ('canceled', 'unpaid') AND OLD.status NOT IN ('canceled', 'unpaid') THEN
    UPDATE coach_students
    SET status = 'inactive', updated_at = NOW()
    WHERE coach_id = NEW.coach_id AND student_id = NEW.aluno_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: atualizar status do aluno ao cancelar assinatura
DROP TRIGGER IF EXISTS trigger_update_student_on_cancel ON subscriptions;
CREATE TRIGGER trigger_update_student_on_cancel
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_status_on_cancel();

-- Função para listar alunos ativos de um coach com informações de assinatura
CREATE OR REPLACE FUNCTION get_coach_active_students(p_coach_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  subscription_id UUID,
  subscription_status TEXT,
  amount INTEGER,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as student_id,
    p.full_name as student_name,
    p.email as student_email,
    s.id as subscription_id,
    s.status as subscription_status,
    s.amount,
    s.current_period_end,
    cs.created_at
  FROM coach_students cs
  JOIN profiles p ON cs.student_id = p.id
  LEFT JOIN subscriptions s ON s.aluno_id = cs.student_id
    AND s.coach_id = cs.coach_id
    AND s.status IN ('active', 'trialing')
  WHERE cs.coach_id = p_coach_id
    AND cs.status = 'active'
  ORDER BY cs.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular receita total do coach
CREATE OR REPLACE FUNCTION get_coach_revenue_stats(p_coach_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'monthly_recurring_revenue', COALESCE(SUM(s.amount) FILTER (WHERE s.status = 'active' AND s.interval = 'month'), 0),
    'active_subscriptions', COUNT(*) FILTER (WHERE s.status IN ('active', 'trialing')),
    'total_students', COUNT(DISTINCT cs.student_id),
    'active_students', COUNT(*) FILTER (WHERE cs.status = 'active'),
    'total_revenue_lifetime', COALESCE(SUM(p.coach_amount) FILTER (WHERE p.status = 'succeeded'), 0),
    'platform_fee_total', COALESCE(SUM(p.platform_fee) FILTER (WHERE p.status = 'succeeded'), 0)
  ) INTO result
  FROM coach_students cs
  LEFT JOIN subscriptions s ON s.aluno_id = cs.student_id AND s.coach_id = cs.coach_id
  LEFT JOIN payments p ON p.coach_id = cs.coach_id
  WHERE cs.coach_id = p_coach_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEWS ÚTEIS
-- ============================================

-- View: Assinaturas com informações de fee
CREATE OR REPLACE VIEW subscriptions_with_fees AS
SELECT
  s.*,
  p_student.full_name as student_name,
  p_student.email as student_email,
  p_coach.full_name as coach_name,
  p_coach.email as coach_email,
  p_coach.stripe_account_id as coach_stripe_account_id,
  -- Cálculo de fees
  ROUND(s.amount * (s.platform_fee_percent / 100)) as platform_fee_amount,
  s.amount - ROUND(s.amount * (s.platform_fee_percent / 100)) as coach_net_amount
FROM subscriptions s
JOIN profiles p_student ON s.aluno_id = p_student.id
JOIN profiles p_coach ON s.coach_id = p_coach.id;

-- View: Dashboard do coach
CREATE OR REPLACE VIEW coach_dashboard_stats AS
SELECT
  coach_id,
  COUNT(DISTINCT student_id) as total_students,
  COUNT(*) FILTER (WHERE status = 'active') as active_students,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive_students,
  MAX(last_interaction_at) as last_interaction
FROM coach_students
GROUP BY coach_id;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar tabelas criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('coach_subscription_plans', 'coach_students', 'subscriptions')
ORDER BY table_name;

-- Verificar novas colunas em subscriptions
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('plan_id', 'platform_fee_percent', 'stripe_price_id')
ORDER BY column_name;

SELECT '✅ Script executado com sucesso!' as status;
