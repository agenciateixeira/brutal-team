-- ============================================
-- MEGA FIX: RESET COMPLETO DO SISTEMA
-- Configura TODO o fluxo corretamente
-- ============================================

-- PARTE 1: LIMPAR TRIGGERS ANTIGOS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 1: REMOVENDO TRIGGERS ANTIGOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

DROP TRIGGER IF EXISTS trigger_auto_payment_on_plan_creation ON public.student_plans;
DROP TRIGGER IF EXISTS trigger_activate_on_payment_confirmation ON public.payment_history;
DROP TRIGGER IF EXISTS trigger_auto_activate_on_plan_creation ON public.student_plans;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS auto_register_payment_on_plan_creation();
DROP FUNCTION IF EXISTS activate_student_on_payment_confirmation();
DROP FUNCTION IF EXISTS auto_activate_student_on_plan_creation();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- PARTE 2: CRIAR TRIGGER DE CADASTRO (SEMPRE PENDENTE)
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 2: CRIANDO TRIGGER DE CADASTRO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- SEMPRE criar perfil com approved = FALSE (PENDENTE)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved,              -- 🔒 SEMPRE FALSE
    first_access_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    false,                 -- 🔒 BLOQUEADO: Nunca aprovado no cadastro
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Perfil criado PENDENTE: % (%)', NEW.email, NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao criar perfil %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PARTE 3: CRIAR TRIGGER DE APROVAÇÃO (SEM AUTO-APROVAÇÃO)
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 3: CRIANDO TRIGGER DE APROVAÇÃO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

CREATE OR REPLACE FUNCTION auto_activate_student_on_plan_creation()
RETURNS TRIGGER AS $$
DECLARE
  current_month TEXT;
  has_status_column BOOLEAN;
BEGIN
  -- Este trigger SÓ executa quando student_plan é criado
  -- (ou seja, quando coach APROVA manualmente)

  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Verificar se tabela tem coluna status
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_history'
      AND column_name = 'status'
  ) INTO has_status_column;

  -- Criar registro de pagamento
  IF has_status_column THEN
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes, status
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach',
      'paid'
    );
  ELSE
    INSERT INTO public.payment_history (
      aluno_id, amount, payment_date, reference_month, notes
    ) VALUES (
      NEW.aluno_id, NEW.monthly_value, CURRENT_DATE, current_month,
      'Plano ' || NEW.plan_type || ' - Pagamento confirmado pelo coach'
    );
  END IF;

  -- Atualizar perfil como ATIVO
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

  RAISE NOTICE '✅ Aluno % ativado - Plano: %', NEW.aluno_id, NEW.plan_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_activate_on_plan_creation
  AFTER INSERT ON public.student_plans
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_student_on_plan_creation();

-- PARTE 4: GARANTIR QUE ANAMNESE ESTÁ CONFIGURADA
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 4: VERIFICANDO ANAMNESE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Remover constraint UNIQUE se existir
  BEGIN
    ALTER TABLE public.anamnese_responses
    DROP CONSTRAINT IF EXISTS anamnese_responses_temp_email_key;
    RAISE NOTICE '✅ Constraint UNIQUE removida de temp_email';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Constraint já não existe';
  END;
END $$;

-- PARTE 5: RELATÓRIO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MEGA FIX APLICADO COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FLUXO CONFIGURADO:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Aluno preenche /questionario';
  RAISE NOTICE '   → Salva anamnese com completed = TRUE';
  RAISE NOTICE '';
  RAISE NOTICE '2. Aluno cria conta em /cadastro';
  RAISE NOTICE '   → Trigger cria perfil com approved = FALSE';
  RAISE NOTICE '   → Aluno fica PENDENTE';
  RAISE NOTICE '';
  RAISE NOTICE '3. Coach vê aluno pendente em /coach/dashboard';
  RAISE NOTICE '   → Clica "Aprovar"';
  RAISE NOTICE '   → Define plano e valor';
  RAISE NOTICE '   → API cria student_plan';
  RAISE NOTICE '';
  RAISE NOTICE '4. Trigger de student_plan executa:';
  RAISE NOTICE '   → Cria payment_history';
  RAISE NOTICE '   → Atualiza profile para payment_status = active';
  RAISE NOTICE '   → Marca plano como payment_confirmed = true';
  RAISE NOTICE '';
  RAISE NOTICE '5. Access_code é gerado automaticamente';
  RAISE NOTICE '   → Coach envia código para aluno';
  RAISE NOTICE '';
  RAISE NOTICE '6. Aluno faz login com código';
  RAISE NOTICE '   → Acessa dashboard';
  RAISE NOTICE '   → Envia 3 fotos iniciais';
  RAISE NOTICE '';
  RAISE NOTICE '7. Coach acessa /coach/aluno/[id]';
  RAISE NOTICE '   → Vê anamnese completa';
  RAISE NOTICE '   → Vê 3 fotos iniciais';
  RAISE NOTICE '';
  RAISE NOTICE '8. Coach acessa /coach/pagamentos';
  RAISE NOTICE '   → Vê aluno ATIVO';
  RAISE NOTICE '   → Vê plano e valores';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ MEGA FIX COMPLETO!
