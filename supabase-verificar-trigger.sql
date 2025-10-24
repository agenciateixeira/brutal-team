-- PASSO 1: Verificar o estado atual do trigger
-- Execute este script no SQL Editor do Supabase

-- Ver todos os triggers na tabela auth.users
SELECT
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- Ver a função handle_new_user
SELECT
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user';
