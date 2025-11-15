-- ============================================
-- DIAGNÓSTICO FINAL DO SISTEMA v2
-- Valida que todos os triggers estão corretos
-- ============================================

DO $$
DECLARE
  trigger_rec RECORD;
  function_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO FINAL DO SISTEMA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- ========================================
  -- 1. VERIFICAR TRIGGER DE CADASTRO
  -- ========================================
  RAISE NOTICE '1️⃣ TRIGGER DE CADASTRO (on_auth_user_created):';
  RAISE NOTICE '';

  FOR trigger_rec IN
    SELECT
      tgname,
      CASE tgenabled::text
        WHEN 'O' THEN '✅ HABILITADO'
        WHEN 'D' THEN '❌ DESABILITADO'
        ELSE '⚠️ Status: ' || tgenabled::text
      END as status
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  LOOP
    RAISE NOTICE '  Trigger: %', trigger_rec.tgname;
    RAISE NOTICE '  Status: %', trigger_rec.status;
  END LOOP;

  -- Verificar se função tem approved = FALSE
  FOR function_rec IN
    SELECT pg_get_functiondef(oid) as code
    FROM pg_proc
    WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    IF function_rec.code LIKE '%approved%false%' OR function_rec.code LIKE '%approved%FALSE%' THEN
      RAISE NOTICE '  Função: ✅ Contém "approved = false"';
    ELSE
      RAISE NOTICE '  Função: ⚠️ NÃO contém "approved = false" (PROBLEMA!)';
    END IF;
  END LOOP;

  RAISE NOTICE '';

  -- ========================================
  -- 2. VERIFICAR TRIGGER DE APROVAÇÃO
  -- ========================================
  RAISE NOTICE '2️⃣ TRIGGER DE APROVAÇÃO (trigger_auto_activate_on_plan_creation):';
  RAISE NOTICE '';

  FOR trigger_rec IN
    SELECT
      tgname,
      CASE tgenabled::text
        WHEN 'O' THEN '✅ HABILITADO'
        WHEN 'D' THEN '❌ DESABILITADO'
        ELSE '⚠️ Status: ' || tgenabled::text
      END as status
    FROM pg_trigger
    WHERE tgname = 'trigger_auto_activate_on_plan_creation'
  LOOP
    RAISE NOTICE '  Trigger: %', trigger_rec.tgname;
    RAISE NOTICE '  Status: %', trigger_rec.status;
  END LOOP;

  -- Verificar se função é adaptativa
  FOR function_rec IN
    SELECT pg_get_functiondef(oid) as code
    FROM pg_proc
    WHERE proname = 'auto_activate_student_on_plan_creation'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    IF function_rec.code LIKE '%information_schema.columns%' THEN
      RAISE NOTICE '  Função: ✅ É ADAPTATIVA (detecta colunas)';
    ELSE
      RAISE NOTICE '  Função: ⚠️ NÃO é adaptativa (pode dar erro!)';
    END IF;
  END LOOP;

  RAISE NOTICE '';

  -- ========================================
  -- 3. VERIFICAR ESTRUTURA DE TABELAS
  -- ========================================
  RAISE NOTICE '3️⃣ ESTRUTURA DAS TABELAS:';
  RAISE NOTICE '';

  -- Verificar profiles
  RAISE NOTICE '  Tabela: profiles';
  FOR function_rec IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN ('approved', 'payment_status', 'payment_plan', 'payment_value')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '    ✅ Tem coluna: %', function_rec.column_name;
  END LOOP;

  -- Verificar payment_history
  RAISE NOTICE '  Tabela: payment_history';
  FOR function_rec IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_history'
      AND column_name IN ('status', 'aluno_id', 'amount', 'payment_date')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '    ✅ Tem coluna: %', function_rec.column_name;
  END LOOP;

  RAISE NOTICE '';

  -- ========================================
  -- 4. CONTAR ALUNOS
  -- ========================================
  RAISE NOTICE '4️⃣ ALUNOS NO SISTEMA:';
  RAISE NOTICE '';

  FOR function_rec IN
    SELECT
      COUNT(*) FILTER (WHERE role = 'aluno') as total_alunos,
      COUNT(*) FILTER (WHERE role = 'aluno' AND approved = false) as pendentes,
      COUNT(*) FILTER (WHERE role = 'aluno' AND approved = true) as aprovados
    FROM public.profiles
  LOOP
    RAISE NOTICE '  Total de alunos: %', function_rec.total_alunos;
    RAISE NOTICE '  Pendentes: %', function_rec.pendentes;
    RAISE NOTICE '  Aprovados: %', function_rec.aprovados;
  END LOOP;

  RAISE NOTICE '';

  -- ========================================
  -- 5. RESUMO FINAL
  -- ========================================
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ DIAGNÓSTICO COMPLETO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TUDO PRONTO PARA TESTAR!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 TESTE AGORA:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Criar NOVO cadastro em /cadastro';
  RAISE NOTICE '   → Usar email diferente (ex: teste@gmail.com)';
  RAISE NOTICE '';
  RAISE NOTICE '2. Verificar que aluno fica PENDENTE';
  RAISE NOTICE '   → Coach acessa /coach/dashboard';
  RAISE NOTICE '   → Aluno deve aparecer em "Alunos Pendentes"';
  RAISE NOTICE '';
  RAISE NOTICE '3. Coach aprova o aluno';
  RAISE NOTICE '   → Define plano, valor, dia vencimento';
  RAISE NOTICE '   → Clica "Confirmar Aprovação"';
  RAISE NOTICE '   → NÃO deve dar erro de colunas';
  RAISE NOTICE '';
  RAISE NOTICE '4. Verificar código de acesso';
  RAISE NOTICE '   → Sistema deve mostrar código único';
  RAISE NOTICE '   → Coach envia código para aluno';
  RAISE NOTICE '';
  RAISE NOTICE '5. Aluno faz login com código';
  RAISE NOTICE '   → Acessa /login ou área de primeiro acesso';
  RAISE NOTICE '   → Digita código único';
  RAISE NOTICE '   → Deve acessar dashboard do aluno';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
