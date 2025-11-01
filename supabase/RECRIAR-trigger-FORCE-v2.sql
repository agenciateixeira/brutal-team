-- ============================================
-- RECRIAR TRIGGER FORÇADAMENTE v2
-- Drop + Create = Trigger habilitado automaticamente
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RECRIANDO TRIGGER COM FORÇA';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Tentar remover (pode dar erro se não tiver permissão, mas tudo bem)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  RAISE NOTICE '✅ Trigger removido';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Não conseguiu remover trigger (normal se não tiver permissão)';
END $$;

-- Remover função
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recriar função com SECURITY DEFINER (mais permissões)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE '🔔 [TRIGGER] Novo usuário: % (ID: %)', NEW.email, NEW.id;

  -- INSERIR perfil com approved = FALSE
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
    false,                 -- 🔒 HARDCODED FALSE
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  RAISE NOTICE '✅ [TRIGGER] Perfil criado PENDENTE (approved = FALSE)';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ [TRIGGER] Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Garantir que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon, service_role;

-- Recriar trigger (será criado HABILITADO por padrão)
DO $$
BEGIN
  -- Criar trigger (se já existir, vai dar erro mas continuamos)
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

  RAISE NOTICE '✅ Trigger recriado e HABILITADO automaticamente';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ Trigger já existe, tentando substituir...';
    -- Se já existe, não podemos substituir diretamente
    -- Mas a função foi atualizada, então o trigger vai usar a nova
END $$;

-- Verificar status
DO $$
DECLARE
  trigger_exists BOOLEAN;
  trigger_rec RECORD;
  function_code TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VALIDAÇÃO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Verificar se trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger existe: on_auth_user_created';

    -- Mostrar status
    FOR trigger_rec IN
      SELECT
        tgname,
        CASE tgenabled
          WHEN 'O' THEN '✅ HABILITADO'
          WHEN 'D' THEN '❌ DESABILITADO'
          ELSE '⚠️ Outro status'
        END as status_display
      FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
    LOOP
      RAISE NOTICE 'Status: %', trigger_rec.status_display;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ Trigger NÃO EXISTE';
  END IF;

  -- Mostrar código da função para confirmar approved = FALSE
  SELECT pg_get_functiondef(oid) INTO function_code
  FROM pg_proc
  WHERE proname = 'handle_new_user'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  IF function_code LIKE '%false%' THEN
    RAISE NOTICE '✅ Função contém "false" (approved = FALSE)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Se o trigger ainda está DESABILITADO:';
  RAISE NOTICE '   → Vá em Authentication > Hooks no Supabase Dashboard';
  RAISE NOTICE '   → Ou execute manualmente (pode dar erro de permissão):';
  RAISE NOTICE '   → ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;';
  RAISE NOTICE '';
  RAISE NOTICE '2. Se o trigger está HABILITADO:';
  RAISE NOTICE '   → Execute o próximo SQL: FIX-DEFINITIVO-trigger-aprovacao.sql';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
