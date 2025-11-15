-- ============================================
-- DIAGNÓSTICO COMPLETO DO CADASTRO
-- EMAIL: guisdomkt@gmail.com
-- ============================================

DO $$
DECLARE
  aluno_email TEXT := 'guisdomkt@gmail.com';
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO - %', aluno_email;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- 1. VERIFICAR SE EXISTE EM auth.users
  RAISE NOTICE '1. USUÁRIO EM AUTH.USERS:';
  FOR rec IN
    SELECT
      id,
      email,
      created_at,
      raw_user_meta_data
    FROM auth.users
    WHERE email = aluno_email
  LOOP
    RAISE NOTICE '  ✅ Encontrado em auth.users';
    RAISE NOTICE '  ID: %', rec.id;
    RAISE NOTICE '  Email: %', rec.email;
    RAISE NOTICE '  Criado em: %', rec.created_at;
    RAISE NOTICE '  Metadata: %', rec.raw_user_meta_data;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ NÃO EXISTE em auth.users';
  END IF;
  RAISE NOTICE '';

  -- 2. VERIFICAR SE EXISTE EM profiles
  RAISE NOTICE '2. PERFIL EM PROFILES:';
  FOR rec IN
    SELECT
      id,
      email,
      full_name,
      role,
      approved,
      approved_at,
      approved_by,
      payment_status,
      created_at
    FROM public.profiles
    WHERE email = aluno_email
  LOOP
    RAISE NOTICE '  ✅ Encontrado em profiles';
    RAISE NOTICE '  ID: %', rec.id;
    RAISE NOTICE '  Nome: %', rec.full_name;
    RAISE NOTICE '  Role: %', rec.role;
    RAISE NOTICE '  Aprovado: %', rec.approved;
    RAISE NOTICE '  Aprovado em: %', rec.approved_at;
    RAISE NOTICE '  Aprovado por: %', rec.approved_by;
    RAISE NOTICE '  Status pagamento: %', rec.payment_status;
    RAISE NOTICE '  Criado em: %', rec.created_at;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ NÃO EXISTE em profiles';
  END IF;
  RAISE NOTICE '';

  -- 3. VERIFICAR ANAMNESE
  RAISE NOTICE '3. RESPOSTAS DE ANAMNESE:';
  FOR rec IN
    SELECT
      id,
      temp_email,
      nome_completo,
      completed,
      completed_at,
      created_at
    FROM public.anamnese_responses
    WHERE temp_email = aluno_email
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '  ✅ Encontrada anamnese';
    RAISE NOTICE '  Nome: %', rec.nome_completo;
    RAISE NOTICE '  Completa: %', rec.completed;
    RAISE NOTICE '  Completada em: %', rec.completed_at;
    RAISE NOTICE '  Criada em: %', rec.created_at;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ Nenhuma anamnese encontrada';
  END IF;
  RAISE NOTICE '';

  -- 4. VERIFICAR STUDENT_PLANS
  RAISE NOTICE '4. PLANOS DO ALUNO:';
  FOR rec IN
    SELECT
      sp.id,
      sp.plan_type,
      sp.monthly_value,
      sp.is_active,
      sp.payment_confirmed,
      sp.created_at
    FROM public.student_plans sp
    JOIN public.profiles p ON sp.aluno_id = p.id
    WHERE p.email = aluno_email
    ORDER BY sp.created_at DESC
  LOOP
    RAISE NOTICE '  ✅ Encontrado plano';
    RAISE NOTICE '  Tipo: %', rec.plan_type;
    RAISE NOTICE '  Valor: %', rec.monthly_value;
    RAISE NOTICE '  Ativo: %', rec.is_active;
    RAISE NOTICE '  Pagamento confirmado: %', rec.payment_confirmed;
    RAISE NOTICE '  Criado em: %', rec.created_at;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ Nenhum plano encontrado';
  END IF;
  RAISE NOTICE '';

  -- 5. VERIFICAR ACCESS_CODES
  RAISE NOTICE '5. CÓDIGOS DE ACESSO:';
  FOR rec IN
    SELECT
      ac.code,
      ac.used,
      ac.created_at
    FROM public.access_codes ac
    JOIN public.profiles p ON ac.aluno_id = p.id
    WHERE p.email = aluno_email
    ORDER BY ac.created_at DESC
  LOOP
    RAISE NOTICE '  ✅ Encontrado código';
    RAISE NOTICE '  Código: %', rec.code;
    RAISE NOTICE '  Usado: %', rec.used;
    RAISE NOTICE '  Criado em: %', rec.created_at;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ Nenhum código encontrado';
  END IF;
  RAISE NOTICE '';

  -- 6. VERIFICAR TRIGGERS ATIVOS
  RAISE NOTICE '6. TRIGGERS ATIVOS:';
  FOR rec IN
    SELECT
      tgname,
      tgrelid::regclass AS tabela,
      tgenabled
    FROM pg_trigger
    WHERE tgname LIKE '%student%' OR tgname LIKE '%profile%' OR tgname LIKE '%auth%'
      AND tgname NOT LIKE 'pg_%'
    ORDER BY tgname
  LOOP
    RAISE NOTICE '  Trigger: % na tabela % (enabled: %)', rec.tgname, rec.tabela, rec.tgenabled;
  END LOOP;
  RAISE NOTICE '';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'FIM DO DIAGNÓSTICO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
