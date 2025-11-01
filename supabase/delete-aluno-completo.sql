-- ============================================
-- DELETAR ALUNO COMPLETAMENTE DO SISTEMA
-- Apaga de TODAS as tabelas relacionadas
-- ============================================

-- ⚠️ ATENÇÃO: Substitua o email do aluno antes de executar!
-- Exemplo: WHERE email = 'aluno@exemplo.com'

DO $$
DECLARE
  aluno_id_var UUID;
  aluno_email_var TEXT := 'SEU_EMAIL_AQUI@gmail.com'; -- 🔴 ALTERE AQUI!
  rec RECORD;
BEGIN
  -- Buscar ID do aluno pelo email
  SELECT id INTO aluno_id_var
  FROM auth.users
  WHERE email = aluno_email_var;

  IF aluno_id_var IS NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ALUNO NÃO ENCONTRADO: %', aluno_email_var;
    RAISE NOTICE '';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DELETANDO ALUNO COMPLETAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Email: %', aluno_email_var;
  RAISE NOTICE 'ID: %', aluno_id_var;
  RAISE NOTICE '';

  -- 1. Deletar de anamnese_responses
  DELETE FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Anamnese deletada: % registros', rec;

  -- 2. Deletar de first_access_photos
  DELETE FROM public.first_access_photos
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Fotos de primeiro acesso deletadas: % registros', rec;

  -- 3. Deletar de progress_photos
  DELETE FROM public.progress_photos
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Fotos de progresso deletadas: % registros', rec;

  -- 4. Deletar de weekly_summaries
  DELETE FROM public.weekly_summaries
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Resumos semanais deletados: % registros', rec;

  -- 5. Deletar de messages
  DELETE FROM public.messages
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Mensagens deletadas: % registros', rec;

  -- 6. Deletar de dietas
  DELETE FROM public.dietas
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Dietas deletadas: % registros', rec;

  -- 7. Deletar de treinos
  DELETE FROM public.treinos
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Treinos deletados: % registros', rec;

  -- 8. Deletar de protocolos_hormonais
  DELETE FROM public.protocolos_hormonais
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Protocolos deletados: % registros', rec;

  -- 9. Deletar de payment_history
  DELETE FROM public.payment_history
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Histórico de pagamentos deletado: % registros', rec;

  -- 10. Deletar de student_plans
  DELETE FROM public.student_plans
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Planos deletados: % registros', rec;

  -- 11. Deletar de access_codes
  DELETE FROM public.access_codes
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Códigos de acesso deletados: % registros', rec;

  -- 12. Deletar de coach_notifications
  DELETE FROM public.coach_notifications
  WHERE aluno_id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Notificações deletadas: % registros', rec;

  -- 13. Deletar de profiles
  DELETE FROM public.profiles
  WHERE id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Perfil deletado: % registros', rec;

  -- 14. Deletar de auth.users (ÚLTIMA ETAPA)
  DELETE FROM auth.users
  WHERE id = aluno_id_var;
  GET DIAGNOSTICS rec = ROW_COUNT;
  RAISE NOTICE '✅ Usuário deletado do auth: % registros', rec;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALUNO DELETADO COMPLETAMENTE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Agora você pode se cadastrar novamente com o email: %', aluno_email_var;
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Acesse /questionario e preencha a anamnese';
  RAISE NOTICE '2. Acesse /cadastro e crie sua conta';
  RAISE NOTICE '3. Aguarde aprovação do coach';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ SCRIPT COMPLETO!
--
-- COMO USAR:
-- 1. ⚠️ Altere a linha 12: aluno_email_var := 'SEU_EMAIL_AQUI@gmail.com'
-- 2. Execute este SQL no Supabase SQL Editor
-- 3. Verifique o relatório no console
-- 4. Cadastre-se novamente pelo /questionario
--
-- O QUE SERÁ DELETADO:
-- ✅ Anamnese (questionário)
-- ✅ Fotos de primeiro acesso
-- ✅ Fotos de progresso
-- ✅ Resumos semanais
-- ✅ Mensagens
-- ✅ Dietas
-- ✅ Treinos
-- ✅ Protocolos hormonais
-- ✅ Histórico de pagamentos
-- ✅ Planos
-- ✅ Códigos de acesso
-- ✅ Notificações
-- ✅ Perfil (profiles)
-- ✅ Usuário (auth.users)
