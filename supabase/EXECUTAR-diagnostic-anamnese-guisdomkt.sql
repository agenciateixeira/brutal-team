-- ============================================
-- DIAGNÓSTICO: Por que respostas da anamnese não aparecem?
-- EMAIL: guisdomkt@gmail.com
-- ============================================

DO $$
DECLARE
  aluno_email_var TEXT := 'guisdomkt@gmail.com';
  rec RECORD;
  total_respostas INTEGER;
  total_completas INTEGER;
  total_incompletas INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO DE RESPOSTAS DA ANAMNESE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Email do aluno: %', aluno_email_var;
  RAISE NOTICE '';

  -- 1. Verificar se o aluno existe em profiles
  SELECT COUNT(*) INTO total_respostas
  FROM public.profiles
  WHERE email = aluno_email_var;

  IF total_respostas = 0 THEN
    RAISE NOTICE '❌ ALUNO NÃO EXISTE NA TABELA PROFILES';
    RAISE NOTICE 'Execute primeiro: diagnostic-and-fix-profiles.sql';
    RAISE NOTICE '';
    RETURN;
  ELSE
    RAISE NOTICE '✅ Aluno encontrado na tabela profiles';
  END IF;

  -- 2. Verificar respostas de anamnese
  SELECT COUNT(*) INTO total_respostas
  FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var;

  SELECT COUNT(*) INTO total_completas
  FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var
    AND completed = true;

  SELECT COUNT(*) INTO total_incompletas
  FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var
    AND (completed = false OR completed IS NULL);

  RAISE NOTICE '';
  RAISE NOTICE 'RESPOSTAS DE ANAMNESE:';
  RAISE NOTICE '  Total de respostas: %', total_respostas;
  RAISE NOTICE '  Respostas completas: %', total_completas;
  RAISE NOTICE '  Respostas incompletas: %', total_incompletas;
  RAISE NOTICE '';

  IF total_respostas = 0 THEN
    RAISE NOTICE '❌ NENHUMA RESPOSTA ENCONTRADA';
    RAISE NOTICE 'O aluno ainda não preencheu o questionário em /questionario';
    RAISE NOTICE '';
    RETURN;
  END IF;

  -- 3. Listar todas as respostas
  RAISE NOTICE 'DETALHES DAS RESPOSTAS:';
  FOR rec IN
    SELECT
      id,
      temp_email,
      nome_completo,
      idade,
      completed,
      completed_at,
      created_at
    FROM public.anamnese_responses
    WHERE temp_email = aluno_email_var
    ORDER BY created_at DESC
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '  Resposta ID: %', rec.id;
    RAISE NOTICE '  Email: %', rec.temp_email;
    RAISE NOTICE '  Nome: %', rec.nome_completo;
    RAISE NOTICE '  Idade: %', rec.idade;
    RAISE NOTICE '  Completa: %', rec.completed;
    RAISE NOTICE '  Completada em: %', rec.completed_at;
    RAISE NOTICE '  Criada em: %', rec.created_at;
  END LOOP;
  RAISE NOTICE '';

  -- 4. Verificar se a query do coach funcionaria
  RAISE NOTICE 'SIMULANDO QUERY DO COACH:';
  FOR rec IN
    SELECT
      ar.id,
      ar.temp_email,
      ar.nome_completo,
      ar.completed,
      ar.completed_at
    FROM public.anamnese_responses ar
    WHERE ar.temp_email = aluno_email_var
      AND ar.completed = true
    ORDER BY ar.completed_at DESC
    LIMIT 1
  LOOP
    RAISE NOTICE '✅ QUERY DO COACH RETORNARIA:';
    RAISE NOTICE '  ID: %', rec.id;
    RAISE NOTICE '  Email: %', rec.temp_email;
    RAISE NOTICE '  Nome: %', rec.nome_completo;
    RAISE NOTICE '  Completada em: %', rec.completed_at;
    RAISE NOTICE '';
    RAISE NOTICE '✅ AS RESPOSTAS DEVERIAM APARECER PARA O COACH!';
    RAISE NOTICE '';
    RETURN;
  END LOOP;

  -- Se chegou aqui, a query não retornou nada
  RAISE NOTICE '❌ QUERY DO COACH NÃO RETORNA NADA!';
  RAISE NOTICE '';
  RAISE NOTICE 'POSSÍVEIS CAUSAS:';
  RAISE NOTICE '1. Resposta não está marcada como completed = true';
  RAISE NOTICE '2. Campo completed_at está NULL';
  RAISE NOTICE '3. Email não bate exatamente';
  RAISE NOTICE '';

  -- 5. Verificar problemas específicos
  IF total_incompletas > 0 THEN
    RAISE NOTICE '⚠️ PROBLEMA: Existe resposta INCOMPLETA';
    RAISE NOTICE 'Solução: Preencha o questionário até o final';
    RAISE NOTICE '';
  END IF;

  -- Verificar se completed_at está NULL mesmo com completed = true
  SELECT COUNT(*) INTO total_respostas
  FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var
    AND completed = true
    AND completed_at IS NULL;

  IF total_respostas > 0 THEN
    RAISE NOTICE '⚠️ PROBLEMA: Resposta marcada como completa mas completed_at é NULL';
    RAISE NOTICE 'Solução: Executar fix abaixo...';
    RAISE NOTICE '';

    -- Corrigir completed_at NULL
    UPDATE public.anamnese_responses
    SET completed_at = NOW()
    WHERE temp_email = aluno_email_var
      AND completed = true
      AND completed_at IS NULL;

    RAISE NOTICE '✅ CORRIGIDO: completed_at atualizado';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
