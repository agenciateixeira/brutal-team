-- ============================================
-- HABILITAR TRIGGER DE CADASTRO
-- E verificar se a função está correta
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'HABILITANDO TRIGGER on_auth_user_created';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Habilitar o trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger habilitado!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICANDO CÓDIGO DA FUNÇÃO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Mostrar código completo da função
SELECT pg_get_functiondef(oid) as codigo_funcao
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VALIDANDO STATUS DO TRIGGER';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Verificar status atual
SELECT
  tgname as trigger_name,
  tgrelid::regclass as tabela,
  CASE tgenabled
    WHEN 'O' THEN 'habilitado'
    WHEN 'D' THEN 'desabilitado'
    WHEN 'R' THEN 'habilitado (replica)'
    WHEN 'A' THEN 'habilitado (sempre)'
    ELSE tgenabled::text
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

DO $$
DECLARE
  trigger_status TEXT;
BEGIN
  SELECT
    CASE tgenabled
      WHEN 'O' THEN 'habilitado'
      WHEN 'D' THEN 'desabilitado'
      ELSE 'outro'
    END
  INTO trigger_status
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  IF trigger_status = 'habilitado' THEN
    RAISE NOTICE '✅ SUCESSO! Trigger está HABILITADO';
  ELSE
    RAISE NOTICE '❌ ATENÇÃO! Trigger está: %', trigger_status;
  END IF;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'AGORA TESTE:';
  RAISE NOTICE '1. Crie um NOVO cadastro com email diferente';
  RAISE NOTICE '2. Verifique se perfil é criado com approved = FALSE';
  RAISE NOTICE '3. Aluno deve aparecer como PENDENTE para o coach';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
