-- ============================================
-- DELETAR ALUNO COMPLETO - VERSÃO SIMPLES
-- EMAIL: agenciagtx1@gmail.com
-- Usa CASCADE para deletar automaticamente
-- ============================================

DO $$
DECLARE
  aluno_id_var UUID;
  aluno_email_var TEXT := 'agenciagtx1@gmail.com';
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

  -- Deletar anamnese (não tem CASCADE, precisa manual)
  DELETE FROM public.anamnese_responses
  WHERE temp_email = aluno_email_var;
  RAISE NOTICE '✅ Anamnese deletada';

  -- Deletar perfil (CASCADE deleta tudo relacionado)
  DELETE FROM public.profiles
  WHERE id = aluno_id_var;
  RAISE NOTICE '✅ Perfil deletado (CASCADE deleta relacionados)';

  -- Deletar usuário do auth (última etapa)
  DELETE FROM auth.users
  WHERE id = aluno_id_var;
  RAISE NOTICE '✅ Usuário deletado do auth';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALUNO DELETADO COMPLETAMENTE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Agora você pode se cadastrar novamente com: %', aluno_email_var;
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Acesse /questionario e preencha até o fim';
  RAISE NOTICE '2. Acesse /cadastro e crie sua conta';
  RAISE NOTICE '3. Aguarde aprovação do coach';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
