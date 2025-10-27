-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE SIGNUP
-- Execute este arquivo inteiro no Supabase SQL Editor
-- ============================================

-- 1. REMOVER TRIGGER E FUNÇÃO ANTIGA
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CRIAR FUNÇÃO ATUALIZADA
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
    approved
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'approved')::boolean, false)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER ATUALIZADO
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. MIGRAR USUÁRIOS EXISTENTES
-- ============================================
INSERT INTO public.profiles (id, email, full_name, role, approved)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
  COALESCE((au.raw_user_meta_data->>'approved')::boolean, false)
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 5. RELATÓRIO FINAL
-- ============================================
SELECT
  'RELATÓRIO DE MIGRAÇÃO' as status,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
  (SELECT COUNT(*) FROM public.profiles) as total_perfis_criados,
  (SELECT COUNT(*) FROM public.profiles WHERE approved = false AND role = 'aluno') as alunos_pendentes_aprovacao,
  (SELECT COUNT(*) FROM public.profiles WHERE approved = true AND role = 'aluno') as alunos_aprovados;

-- ✅ SETUP COMPLETO!
--
-- O QUE FOI FEITO:
-- 1. Trigger corrigido para capturar full_name
-- 2. Novos alunos terão approved=false automaticamente
-- 3. Usuários existentes foram migrados
--
-- PRÓXIMOS PASSOS:
-- 1. Teste criar um novo aluno em /cadastro
-- 2. Verifique se ele aparece em "Cadastros Pendentes" no dashboard do coach
-- 3. Aprove o aluno
-- 4. Envie dieta e treino em "Novos Alunos"
