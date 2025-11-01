-- ============================================
-- DIAGNÓSTICO E CORREÇÃO DE PERFIS FALTANTES
-- Execute este arquivo para verificar e corrigir
-- ============================================

-- 1. VERIFICAR SE O TRIGGER EXISTE
-- ============================================
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Verificar se trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;

  -- Verificar se função existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) INTO function_exists;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO DE TRIGGERS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Trigger on_auth_user_created existe: %', trigger_exists;
  RAISE NOTICE 'Função handle_new_user existe: %', function_exists;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- 2. RECRIAR TRIGGER (garantir que está correto)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir novo perfil na tabela profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved,
    first_access_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'approved')::boolean, false),
    false
  );

  RAISE NOTICE '✅ Perfil criado: % (%) - Role: %',
    NEW.email,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno');

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '⚠️ Perfil já existe: %', NEW.email;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao criar perfil %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE '✅ Trigger recriado com sucesso!';

-- 3. MIGRAR USUÁRIOS EXISTENTES SEM PERFIL
-- ============================================
DO $$
DECLARE
  usuarios_migrados INTEGER := 0;
BEGIN
  -- Criar perfis para todos os usuários que não têm
  WITH usuarios_sem_perfil AS (
    INSERT INTO public.profiles (id, email, full_name, role, approved, first_access_completed)
    SELECT
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', ''),
      COALESCE((au.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
      COALESCE((au.raw_user_meta_data->>'approved')::boolean, false),
      false
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO usuarios_migrados FROM usuarios_sem_perfil;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migração concluída: % perfis criados', usuarios_migrados;
  RAISE NOTICE '';
END $$;

-- 4. RELATÓRIO DETALHADO
-- ============================================
DO $$
DECLARE
  rec RECORD;
  total_auth INTEGER;
  total_profiles INTEGER;
  usuarios_sem_perfil INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO usuarios_sem_perfil
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RELATÓRIO FINAL';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total de usuários em auth.users: %', total_auth;
  RAISE NOTICE 'Total de perfis em profiles: %', total_profiles;
  RAISE NOTICE 'Usuários SEM perfil: %', usuarios_sem_perfil;
  RAISE NOTICE '';

  -- Listar alunos por status
  RAISE NOTICE 'ALUNOS POR STATUS:';
  FOR rec IN
    SELECT
      approved,
      COUNT(*) as total
    FROM public.profiles
    WHERE role = 'aluno'
    GROUP BY approved
  LOOP
    RAISE NOTICE '  - %: %', CASE WHEN rec.approved THEN 'Aprovados' ELSE 'Pendentes' END, rec.total;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'USUÁRIOS SEM PERFIL (se houver):';
  FOR rec IN
    SELECT
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data->>'full_name' as nome,
      au.raw_user_meta_data->>'role' as role_metadata
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    LIMIT 10
  LOOP
    RAISE NOTICE '  ❌ % (%) - %', rec.email, rec.nome, rec.role_metadata;
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ DIAGNÓSTICO E CORREÇÃO COMPLETOS!
--
-- O QUE FOI FEITO:
-- 1. ✅ Verificado se triggers existem
-- 2. ✅ Trigger recriado (garantir que está correto)
-- 3. ✅ Perfis faltantes criados automaticamente
-- 4. ✅ Relatório detalhado gerado
--
-- APÓS EXECUTAR:
-- - Verifique o relatório no console
-- - Se aparecerem usuários sem perfil, eles foram criados agora
-- - Novos cadastros devem criar perfis automaticamente
