-- PASSO 3: Migrar usuários existentes que não têm perfil
-- Execute este script DEPOIS de recriar o trigger

-- Inserir perfis para usuários que não têm
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'aluno'::user_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Ver quantos foram migrados
SELECT
  'Migrados ' || COUNT(*) || ' usuários' as resultado
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NOT NULL;
