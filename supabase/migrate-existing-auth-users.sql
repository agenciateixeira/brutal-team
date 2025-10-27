-- ============================================
-- MIGRAR USUÁRIOS EXISTENTES
-- Criar perfis para usuários que estão em auth.users mas não em profiles
-- ============================================

-- Inserir perfis para todos os usuários de auth.users que não têm perfil
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

-- Verificar quantos perfis foram criados
SELECT
  COUNT(*) as total_usuarios_auth,
  (SELECT COUNT(*) FROM public.profiles) as total_perfis_criados,
  COUNT(*) - (SELECT COUNT(*) FROM public.profiles) as usuarios_sem_perfil
FROM auth.users;

-- ✅ Migração completa!
-- Todos os usuários de auth.users agora têm um perfil em profiles
