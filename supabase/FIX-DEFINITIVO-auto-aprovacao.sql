-- ============================================
-- FIX DEFINITIVO: ACABAR COM AUTO-APROVAÇÃO
-- Remove COMPLETAMENTE triggers antigos e recria
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 1: VERIFICANDO TRIGGER ATUAL';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Mostrar código do trigger atual (se existir)
SELECT
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 2: REMOVENDO TUDO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Remover trigger e função COMPLETAMENTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger e função removidos';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 3: RECRIANDO COM APPROVED = FALSE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Criar função NOVA que GARANTE approved = FALSE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE '🔔 Novo usuário criado: % (%)', NEW.email, NEW.id;

  -- SEMPRE criar perfil com approved = FALSE
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved,              -- 🔒 HARDCODED FALSE
    first_access_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    false,                 -- 🔒 SEMPRE FALSE - NUNCA TRUE
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Perfil criado PENDENTE (approved = FALSE): %', NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao criar perfil para %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger recriado!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PARTE 4: VALIDAÇÃO';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- Verificar que o trigger foi criado
SELECT
  tgname as trigger_name,
  tgrelid::regclass as tabela,
  tgenabled as habilitado,
  pg_get_triggerdef(oid) as definicao
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FIX DEFINITIVO APLICADO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger recriado com approved = FALSE GARANTIDO';
  RAISE NOTICE '';
  RAISE NOTICE 'TESTE AGORA:';
  RAISE NOTICE '1. Crie um novo cadastro';
  RAISE NOTICE '2. Aluno deve ficar PENDENTE (approved = FALSE)';
  RAISE NOTICE '3. Coach deve ver aluno em "Alunos Pendentes"';
  RAISE NOTICE '4. Coach aprova manualmente';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
