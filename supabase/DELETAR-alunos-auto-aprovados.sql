-- ============================================
-- DELETAR ALUNOS AUTO-APROVADOS
-- guisdomkt@gmail.com e agenciagtx1@gmail.com
-- ============================================

DO $$
DECLARE
  aluno1_id UUID;
  aluno2_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DELETANDO ALUNOS AUTO-APROVADOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Buscar IDs dos alunos
  SELECT id INTO aluno1_id FROM auth.users WHERE email = 'guisdomkt@gmail.com';
  SELECT id INTO aluno2_id FROM auth.users WHERE email = 'agenciagtx1@gmail.com';

  IF aluno1_id IS NULL AND aluno2_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum dos alunos encontrado';
    RETURN;
  END IF;

  -- ========================================
  -- DELETAR guisdomkt@gmail.com
  -- ========================================
  IF aluno1_id IS NOT NULL THEN
    RAISE NOTICE '🗑️ Deletando: guisdomkt@gmail.com (ID: %)', aluno1_id;

    -- Deletar anamnese
    DELETE FROM public.anamnese_responses WHERE temp_email = 'guisdomkt@gmail.com';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Anamnese: % registro(s) deletado(s)', deleted_count;

    -- Deletar fotos
    DELETE FROM public.first_access_photos WHERE aluno_id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Fotos: % registro(s) deletado(s)', deleted_count;

    -- Deletar códigos de acesso
    DELETE FROM public.access_codes WHERE aluno_id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Códigos: % registro(s) deletado(s)', deleted_count;

    -- Deletar histórico de pagamento
    DELETE FROM public.payment_history WHERE aluno_id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Histórico pagamento: % registro(s) deletado(s)', deleted_count;

    -- Deletar planos
    DELETE FROM public.student_plans WHERE aluno_id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Planos: % registro(s) deletado(s)', deleted_count;

    -- Deletar perfil
    DELETE FROM public.profiles WHERE id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Perfil: % registro(s) deletado(s)', deleted_count;

    -- Deletar usuário
    DELETE FROM auth.users WHERE id = aluno1_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Usuário: % registro(s) deletado(s)', deleted_count;

    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '⚠️ guisdomkt@gmail.com não encontrado';
    RAISE NOTICE '';
  END IF;

  -- ========================================
  -- DELETAR agenciagtx1@gmail.com
  -- ========================================
  IF aluno2_id IS NOT NULL THEN
    RAISE NOTICE '🗑️ Deletando: agenciagtx1@gmail.com (ID: %)', aluno2_id;

    -- Deletar anamnese
    DELETE FROM public.anamnese_responses WHERE temp_email = 'agenciagtx1@gmail.com';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Anamnese: % registro(s) deletado(s)', deleted_count;

    -- Deletar fotos
    DELETE FROM public.first_access_photos WHERE aluno_id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Fotos: % registro(s) deletado(s)', deleted_count;

    -- Deletar códigos de acesso
    DELETE FROM public.access_codes WHERE aluno_id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Códigos: % registro(s) deletado(s)', deleted_count;

    -- Deletar histórico de pagamento
    DELETE FROM public.payment_history WHERE aluno_id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Histórico pagamento: % registro(s) deletado(s)', deleted_count;

    -- Deletar planos
    DELETE FROM public.student_plans WHERE aluno_id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Planos: % registro(s) deletado(s)', deleted_count;

    -- Deletar perfil
    DELETE FROM public.profiles WHERE id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Perfil: % registro(s) deletado(s)', deleted_count;

    -- Deletar usuário
    DELETE FROM auth.users WHERE id = aluno2_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  ✅ Usuário: % registro(s) deletado(s)', deleted_count;

    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '⚠️ agenciagtx1@gmail.com não encontrado';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALUNOS DELETADOS COM SUCESSO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMO PASSO:';
  RAISE NOTICE '1. Criar NOVO cadastro com email diferente';
  RAISE NOTICE '2. Verificar se aluno fica PENDENTE (approved = false)';
  RAISE NOTICE '3. Coach aprovar manualmente';
  RAISE NOTICE '4. Verificar que não dá erro';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
