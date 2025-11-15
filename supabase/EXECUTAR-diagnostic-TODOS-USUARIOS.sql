-- ============================================
-- DIAGNÓSTICO COMPLETO DE TODOS OS USUÁRIOS
-- Mostra estado de todos os emails no sistema
-- ============================================

DO $$
DECLARE
  aluno_rec RECORD;
  plano_rec RECORD;
  codigo_rec RECORD;
  anamnese_rec RECORD;
  trigger_rec RECORD;
  total_users INTEGER;
  total_pendentes INTEGER;
  total_aprovados INTEGER;
  total_com_plano INTEGER;
  total_com_anamnese INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO COMPLETO DO SISTEMA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Contar totais
  SELECT COUNT(*) INTO total_users FROM public.profiles WHERE role = 'aluno';
  SELECT COUNT(*) INTO total_pendentes FROM public.profiles WHERE role = 'aluno' AND approved = false;
  SELECT COUNT(*) INTO total_aprovados FROM public.profiles WHERE role = 'aluno' AND approved = true;
  SELECT COUNT(*) INTO total_com_plano FROM public.student_plans;
  SELECT COUNT(*) INTO total_com_anamnese FROM public.anamnese_responses WHERE completed = true;

  RAISE NOTICE '📊 RESUMO GERAL:';
  RAISE NOTICE '  Total de alunos: %', total_users;
  RAISE NOTICE '  Pendentes de aprovação: %', total_pendentes;
  RAISE NOTICE '  Aprovados: %', total_aprovados;
  RAISE NOTICE '  Com plano criado: %', total_com_plano;
  RAISE NOTICE '  Com anamnese completa: %', total_com_anamnese;
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Lista detalhada de cada aluno
  FOR aluno_rec IN
    SELECT
      p.id,
      p.email,
      p.full_name,
      p.approved,
      p.approved_at,
      p.payment_status,
      p.created_at,
      (SELECT COUNT(*) FROM public.student_plans sp WHERE sp.aluno_id = p.id) as tem_plano,
      (SELECT COUNT(*) FROM public.access_codes ac WHERE ac.aluno_id = p.id) as tem_codigo,
      (SELECT COUNT(*) FROM public.anamnese_responses ar WHERE ar.temp_email = p.email AND ar.completed = true) as tem_anamnese
    FROM public.profiles p
    WHERE p.role = 'aluno'
    ORDER BY p.created_at DESC
  LOOP
    RAISE NOTICE '👤 ALUNO: %', aluno_rec.email;
    RAISE NOTICE '   Nome: %', COALESCE(aluno_rec.full_name, '(não informado)');
    RAISE NOTICE '   ID: %', aluno_rec.id;
    RAISE NOTICE '   Cadastrado em: %', aluno_rec.created_at;
    RAISE NOTICE '';

    -- Status de aprovação
    IF aluno_rec.approved THEN
      RAISE NOTICE '   ✅ APROVADO em: %', aluno_rec.approved_at;
    ELSE
      RAISE NOTICE '   ⏳ PENDENTE de aprovação';
    END IF;

    -- Status de pagamento
    RAISE NOTICE '   💳 Status pagamento: %', COALESCE(aluno_rec.payment_status, 'nenhum');

    -- Tem plano?
    IF aluno_rec.tem_plano > 0 THEN
      RAISE NOTICE '   📋 Plano: % plano(s) criado(s)', aluno_rec.tem_plano;

      -- Mostrar detalhes do plano
      FOR plano_rec IN
        SELECT plan_type, monthly_value, is_active, payment_confirmed, created_at
        FROM public.student_plans
        WHERE aluno_id = aluno_rec.id
        ORDER BY created_at DESC
        LIMIT 1
      LOOP
        RAISE NOTICE '      Tipo: %', plano_rec.plan_type;
        RAISE NOTICE '      Valor: R$ %', plano_rec.monthly_value;
        RAISE NOTICE '      Ativo: %', plano_rec.is_active;
        RAISE NOTICE '      Confirmado: %', plano_rec.payment_confirmed;
      END LOOP;
    ELSE
      RAISE NOTICE '   ❌ Sem plano criado';
    END IF;

    -- Tem código?
    IF aluno_rec.tem_codigo > 0 THEN
      RAISE NOTICE '   🔑 Código: % código(s) gerado(s)', aluno_rec.tem_codigo;

      -- Mostrar último código
      FOR codigo_rec IN
        SELECT code, created_at
        FROM public.access_codes
        WHERE aluno_id = aluno_rec.id
        ORDER BY created_at DESC
        LIMIT 1
      LOOP
        RAISE NOTICE '      Último código: %', codigo_rec.code;
        RAISE NOTICE '      Criado em: %', codigo_rec.created_at;
      END LOOP;
    ELSE
      RAISE NOTICE '   ❌ Sem código de acesso';
    END IF;

    -- Tem anamnese?
    IF aluno_rec.tem_anamnese > 0 THEN
      RAISE NOTICE '   📝 Anamnese: % anamnese(s) completa(s)', aluno_rec.tem_anamnese;

      -- Mostrar detalhes
      FOR anamnese_rec IN
        SELECT nome_completo, completed_at
        FROM public.anamnese_responses
        WHERE temp_email = aluno_rec.email AND completed = true
        ORDER BY completed_at DESC
        LIMIT 1
      LOOP
        RAISE NOTICE '      Nome na anamnese: %', anamnese_rec.nome_completo;
        RAISE NOTICE '      Completada em: %', anamnese_rec.completed_at;
      END LOOP;
    ELSE
      RAISE NOTICE '   ❌ Sem anamnese completa';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '---';
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 TRIGGERS ATIVOS NO SISTEMA:';
  RAISE NOTICE '';

  FOR trigger_rec IN
    SELECT
      tgname as trigger_name,
      tgrelid::regclass AS tabela,
      tgenabled
    FROM pg_trigger
    WHERE tgname LIKE '%student%'
       OR tgname LIKE '%profile%'
       OR tgname LIKE '%auth%'
       OR tgname LIKE '%payment%'
       OR tgname LIKE '%access%'
    AND tgname NOT LIKE 'pg_%'
    AND tgname NOT LIKE 'RI_%'
    ORDER BY tgname
  LOOP
    RAISE NOTICE '  🔗 % → % (enabled: %)', trigger_rec.trigger_name, trigger_rec.tabela, trigger_rec.tgenabled;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FIM DO DIAGNÓSTICO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
