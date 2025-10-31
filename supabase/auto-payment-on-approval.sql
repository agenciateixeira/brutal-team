-- ============================================
-- REGISTRO AUTOMÁTICO DE PAGAMENTO QUANDO COACH APROVAR ALUNO
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- 1. CRIAR FUNÇÃO PARA REGISTRAR PAGAMENTO AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION auto_register_payment_on_plan_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
BEGIN
  -- Formatar mês de referência (YYYY-MM)
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Criar registro de pagamento inicial
  INSERT INTO public.payment_history (
    aluno_id,
    amount,
    payment_date,
    payment_method,
    reference_month,
    notes,
    created_by
  )
  VALUES (
    NEW.aluno_id,
    NEW.monthly_value,
    CURRENT_DATE,
    'Pendente', -- Aguardando confirmação de pagamento
    current_month,
    CASE
      WHEN NEW.plan_type = 'mensal' THEN 'Plano Mensal - Pagamento inicial'
      WHEN NEW.plan_type = 'semestral' THEN 'Plano Semestral - Pagamento inicial'
      WHEN NEW.plan_type = 'anual' THEN 'Plano Anual - Pagamento inicial'
      ELSE 'Pagamento inicial'
    END,
    NEW.aluno_id -- Criado pelo próprio aluno (aprovação do coach)
  );

  -- Atualizar perfil do aluno com informações de pagamento
  UPDATE public.profiles
  SET
    payment_status = 'pending', -- Aguardando confirmação
    payment_plan = NEW.plan_type,
    payment_value = NEW.monthly_value,
    payment_due_day = NEW.due_day,
    updated_at = NOW()
  WHERE id = NEW.aluno_id;

  RAISE NOTICE 'Pagamento inicial registrado para aluno % - Plano: % - Valor: %',
    NEW.aluno_id,
    NEW.plan_type,
    NEW.monthly_value;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRIAR TRIGGER PARA EXECUTAR APÓS CRIAR student_plan
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_payment_on_plan_creation ON public.student_plans;
CREATE TRIGGER trigger_auto_payment_on_plan_creation
  AFTER INSERT ON public.student_plans
  FOR EACH ROW
  EXECUTE FUNCTION auto_register_payment_on_plan_creation();

-- 3. CRIAR FUNÇÃO PARA ATIVAR ALUNO QUANDO PAGAMENTO FOR CONFIRMADO
-- ============================================
CREATE OR REPLACE FUNCTION activate_student_on_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando o payment_method mudar de 'Pendente' para qualquer outra coisa,
  -- significa que o pagamento foi confirmado
  IF OLD.payment_method = 'Pendente' AND NEW.payment_method != 'Pendente' THEN
    -- Atualizar status do aluno para ativo
    UPDATE public.profiles
    SET
      payment_status = 'active',
      last_payment_date = NEW.payment_date,
      updated_at = NOW()
    WHERE id = NEW.aluno_id;

    -- Atualizar student_plan para payment_confirmed = true
    UPDATE public.student_plans
    SET
      payment_confirmed = true,
      updated_at = NOW()
    WHERE aluno_id = NEW.aluno_id
      AND is_active = true;

    RAISE NOTICE 'Aluno % ativado após confirmação de pagamento', NEW.aluno_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR TRIGGER PARA ATIVAR ALUNO QUANDO PAGAMENTO FOR CONFIRMADO
-- ============================================
DROP TRIGGER IF EXISTS trigger_activate_on_payment_confirmation ON public.payment_history;
CREATE TRIGGER trigger_activate_on_payment_confirmation
  AFTER UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION activate_student_on_payment_confirmation();

-- 5. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION auto_register_payment_on_plan_creation() IS
  'Cria automaticamente um registro de pagamento quando um plano é criado (aluno aprovado)';

COMMENT ON FUNCTION activate_student_on_payment_confirmation() IS
  'Ativa o aluno automaticamente quando o pagamento é confirmado (payment_method muda de Pendente)';

-- ✅ SETUP COMPLETO!
--
-- O QUE FOI FEITO:
-- 1. ✅ Trigger criado para registrar pagamento automaticamente ao aprovar aluno
-- 2. ✅ Registro criado em payment_history com status 'Pendente'
-- 3. ✅ Perfil do aluno atualizado com informações de pagamento
-- 4. ✅ Trigger criado para ativar aluno quando pagamento for confirmado
-- 5. ✅ Status muda para 'active' quando coach confirmar o pagamento
--
-- FLUXO COMPLETO:
-- 1. Coach aprova aluno e define plano (mensal/semestral/anual)
-- 2. Trigger cria registro em payment_history com status 'Pendente'
-- 3. Coach confirma pagamento (muda payment_method de 'Pendente' para 'PIX', 'Dinheiro', etc)
-- 4. Trigger ativa o aluno automaticamente (payment_status = 'active')
-- 5. Aluno aparece na página de pagamentos como ativo!
