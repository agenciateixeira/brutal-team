-- ============================================
-- CORREÇÃO DEFINITIVA DO TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIS
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TRIGGER E FUNÇÃO ANTIGA (se existir)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CRIAR FUNÇÃO ATUALIZADA PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================
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
    false -- Primeiro acesso ainda não foi completado
  );

  -- Log de sucesso
  RAISE NOTICE 'Perfil criado automaticamente para usuário: % (%) - Role: %',
    NEW.email,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno');

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, apenas retorna sem erro
    RAISE NOTICE 'Perfil já existe para usuário: % (%)', NEW.email, NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log de erro mas não falha o cadastro
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER PARA NOVOS USUÁRIOS
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. MIGRAR USUÁRIOS EXISTENTES (que estão em auth.users mas não em profiles)
-- ============================================
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
ON CONFLICT (id) DO NOTHING;

-- 5. RELATÓRIO FINAL
-- ============================================
DO $$
DECLARE
  total_auth INTEGER;
  total_profiles INTEGER;
  usuarios_sem_perfil INTEGER;
  alunos_pendentes INTEGER;
  alunos_aprovados INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO usuarios_sem_perfil
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL;
  SELECT COUNT(*) INTO alunos_pendentes
    FROM public.profiles
    WHERE approved = false AND role = 'aluno';
  SELECT COUNT(*) INTO alunos_aprovados
    FROM public.profiles
    WHERE approved = true AND role = 'aluno';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RELATÓRIO DE MIGRAÇÃO DE USUÁRIOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total de usuários em auth.users: %', total_auth;
  RAISE NOTICE 'Total de perfis criados: %', total_profiles;
  RAISE NOTICE 'Usuários sem perfil: %', usuarios_sem_perfil;
  RAISE NOTICE 'Alunos pendentes de aprovação: %', alunos_pendentes;
  RAISE NOTICE 'Alunos aprovados: %', alunos_aprovados;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ SETUP COMPLETO!
--
-- O QUE FOI FEITO:
-- 1. ✅ Trigger criado para capturar automaticamente novos cadastros
-- 2. ✅ Perfis criados automaticamente com full_name, role e approved
-- 3. ✅ Usuários existentes foram migrados para a tabela profiles
-- 4. ✅ Tratamento de erros para evitar falhas no signup
-- 5. ✅ Campo first_access_completed iniciado como false
--
-- PRÓXIMOS PASSOS:
-- 1. Teste criar um novo usuário em /cadastro
-- 2. Verifique se o perfil é criado automaticamente na tabela profiles
-- 3. Se for aluno, ele deve aparecer com approved=false
-- 4. Nunca mais será necessário executar migração manual!
