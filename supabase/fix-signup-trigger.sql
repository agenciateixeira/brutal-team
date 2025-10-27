-- ============================================
-- CORRIGIR TRIGGER DE SIGNUP
-- Capturar full_name e configurar approved=false
-- ============================================

-- Remover trigger e função antiga
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar função atualizada para criar perfil automaticamente
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
    -- Log do erro (você pode ver no Dashboard do Supabase)
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger atualizado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil na tabela profiles quando um novo usuário é cadastrado';

-- ✅ Trigger corrigido!
-- Agora o full_name será capturado dos metadados
-- Todos os novos alunos terão approved=false por padrão
