-- ============================================
-- FIX v2: Sistema de aprovação com pagamento manual
-- Remove campo created_by que não existe
-- ============================================

-- 1. REMOVER TRIGGERS ANTIGOS
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_payment_on_plan_creation ON public.student_plans;
DROP TRIGGER IF EXISTS trigger_activate_on_payment_confirmation ON public.payment_history;
DROP TRIGGER IF EXISTS trigger_auto_activate_on_plan_creation ON public.student_plans;
DROP FUNCTION IF EXISTS auto_register_payment_on_plan_creation();
DROP FUNCTION IF EXISTS activate_student_on_payment_confirmation();
DROP FUNCTION IF EXISTS auto_activate_student_on_plan_creation();

-- 2. CRIAR TABELA payment_history SE NÃO EXISTIR (SEM created_by)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_month TEXT NOT NULL, -- YYYY-MM
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_history_aluno ON public.payment_history(aluno_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON public.payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_month ON public.payment_history(reference_month);

-- RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Coaches podem ver pagamentos de seus alunos" ON public.payment_history;
CREATE POLICY "Coaches podem ver pagamentos de seus alunos"
  ON public.payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Coaches podem criar pagamentos" ON public.payment_history;
CREATE POLICY "Coaches podem criar pagamentos"
  ON public.payment_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'coach'
    )
  );

-- 3. CRIAR FUNÇÃO SIMPLIFICADA - Pagamento Manual (SEM created_by)
-- ============================================
CREATE OR REPLACE FUNCTION auto_activate_student_on_plan_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
BEGIN
  -- Formatar mês de referência (YYYY-MM)
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Criar registro de pagamento já confirmado (manual)
  INSERT INTO public.payment_history (
    aluno_id,
    amount,
    payment_date,
    reference_month,
    notes
  )
  VALUES (
    NEW.aluno_id,
    NEW.monthly_value,
    CURRENT_DATE,
    current_month,
    CASE
      WHEN NEW.plan_type = 'mensal' THEN 'Plano Mensal - Pagamento confirmado manualmente pelo coach'
      WHEN NEW.plan_type = 'semestral' THEN 'Plano Semestral - Pagamento confirmado manualmente pelo coach'
      WHEN NEW.plan_type = 'anual' THEN 'Plano Anual - Pagamento confirmado manualmente pelo coach'
      ELSE 'Pagamento confirmado manualmente'
    END
  );

  -- Atualizar perfil do aluno como ATIVO (pagamento já confirmado)
  UPDATE public.profiles
  SET
    payment_status = 'active', -- JÁ ATIVO (aprovação = pagamento confirmado)
    payment_plan = NEW.plan_type,
    payment_value = NEW.monthly_value,
    payment_due_day = NEW.due_day,
    last_payment_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.aluno_id;

  -- Marcar plano como confirmado
  UPDATE public.student_plans
  SET payment_confirmed = true
  WHERE id = NEW.id;

  RAISE NOTICE 'Aluno % aprovado e ativado - Plano: % - Valor: %',
    NEW.aluno_id,
    NEW.plan_type,
    NEW.monthly_value;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR TRIGGER PARA AUTO-ATIVAR AO CRIAR PLANO
-- ============================================
CREATE TRIGGER trigger_auto_activate_on_plan_creation
  AFTER INSERT ON public.student_plans
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_student_on_plan_creation();

-- 5. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION auto_activate_student_on_plan_creation() IS
  'Ativa o aluno automaticamente quando plano é criado (pagamento manual)';

COMMENT ON TABLE public.payment_history IS
  'Histórico de pagamentos manuais dos alunos';

-- ✅ FIX v2 COMPLETO!
--
-- O QUE FOI CORRIGIDO:
-- 1. ✅ Removido campo created_by que não existe
-- 2. ✅ Tabela payment_history com estrutura correta
-- 3. ✅ Trigger simplificado sem campos extras
-- 4. ✅ Aprovação = pagamento confirmado = aluno ativo
--
-- FLUXO:
-- 1. Coach aprova aluno via dashboard
-- 2. API cria student_plan
-- 3. Trigger cria payment_history (já confirmado)
-- 4. Perfil atualizado para status 'active'
-- 5. Aluno pode acessar sistema imediatamente
