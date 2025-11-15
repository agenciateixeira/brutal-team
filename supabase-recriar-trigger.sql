-- PASSO 2: Recriar o Trigger Completamente
-- Execute este script no SQL Editor do Supabase

-- 1. Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover função antiga
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar a função NOVA
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'aluno'
  );
  RETURN NEW;
END;
$$;

-- 4. Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Confirmar
SELECT 'Trigger recriado com sucesso!' as status;
