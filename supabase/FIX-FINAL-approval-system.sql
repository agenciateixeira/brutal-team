-- ============================================
-- FIX FINAL: Sistema de Aprovação
-- Detecta estrutura real e cria trigger compatível
-- ============================================

-- 1. REMOVER TODOS OS TRIGGERS ANTIGOS
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_payment_on_plan_creation ON public.student_plans;
DROP TRIGGER IF EXISTS trigger_activate_on_payment_confirmation ON public.payment_history;
DROP TRIGGER IF EXISTS trigger_auto_activate_on_plan_creation ON public.student_plans;
DROP FUNCTION IF EXISTS auto_register_payment_on_plan_creation();
DROP FUNCTION IF EXISTS activate_student_on_payment_confirmation();
DROP FUNCTION IF EXISTS auto_activate_student_on_plan_creation();

-- 2. CRIAR FUNÇÃO QUE SE ADAPTA À ESTRUTURA DA TABELA
-- ============================================
CREATE OR REPLACE FUNCTION auto_activate_student_on_plan_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  has_status_column BOOLEAN;
  has_created_by_column BOOLEAN;
BEGIN
  -- Formatar mês de referência
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Verificar quais colunas existem
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_history'
      AND column_name = 'status'
  ) INTO has_status_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_history'
      AND column_name = 'created_by'
  ) INTO has_created_by_column;

  -- Inserir registro de pagamento adaptando às colunas existentes
  IF has_status_column AND has_created_by_column THEN
    -- Tabela tem status E created_by
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes, status, created_by
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach',
      'paid', NEW.aluno_id
    );
  ELSIF has_status_column THEN
    -- Tabela tem status mas NÃO tem created_by
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes, status
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach',
      'paid'
    );
  ELSIF has_created_by_column THEN
    -- Tabela tem created_by mas NÃO tem status
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes, created_by
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach',
      NEW.aluno_id
    );
  ELSE
    -- Tabela NÃO tem status NEM created_by
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach'
    );
  END IF;

  -- Atualizar perfil do aluno como ATIVO
  UPDATE public.profiles
  SET
    payment_status = 'active',
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

  RAISE NOTICE 'Aluno % aprovado e ativado - Plano: %', NEW.aluno_id, NEW.plan_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER
-- ============================================
CREATE TRIGGER trigger_auto_activate_on_plan_creation
  AFTER INSERT ON public.student_plans
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_student_on_plan_creation();

-- 4. RELATÓRIO
-- ============================================
DO $$
DECLARE
  has_status BOOLEAN;
  has_created_by BOOLEAN;
BEGIN
  -- Verificar estrutura
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_history' AND column_name = 'status'
  ) INTO has_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_history' AND column_name = 'created_by'
  ) INTO has_created_by;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FIX FINAL APLICADO COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Estrutura detectada:';
  RAISE NOTICE '  Tem coluna "status": %', has_status;
  RAISE NOTICE '  Tem coluna "created_by": %', has_created_by;
  RAISE NOTICE '';
  RAISE NOTICE 'O trigger foi configurado para se adaptar automaticamente!';
  RAISE NOTICE 'Agora a aprovação de alunos deve funcionar sem erros.';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ FIX FINAL COMPLETO!
--
-- O QUE FOI FEITO:
-- 1. ✅ Trigger INTELIGENTE que detecta quais colunas existem
-- 2. ✅ Se adapta automaticamente à estrutura da tabela
-- 3. ✅ Funciona com qualquer combinação de colunas:
--    - Com status e created_by
--    - Só com status
--    - Só com created_by
--    - Sem nenhum dos dois
-- 4. ✅ Aluno fica ativo ao ser aprovado
-- 5. ✅ Pagamento registrado automaticamente
--
-- ESTE SQL RESOLVE TODOS OS ERROS DE COLUNAS!
