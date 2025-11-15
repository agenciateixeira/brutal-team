-- ============================================
-- CORRIGIR RECURSÃO INFINITA EM POLÍTICAS RLS
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Coaches podem ver alunos pendentes" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. CRIAR POLÍTICAS SIMPLES E SEGURAS (SEM RECURSÃO)

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política 3: Coaches podem ver todos os perfis (sem recursão)
-- Usa auth.jwt() que não causa recursão
CREATE POLICY "Coaches can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'coach'
  );

-- 3. VERIFICAR POLÍTICAS ATIVAS
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. TESTAR ACESSO
-- Teste se consegue ver perfis agora (execute no SQL Editor do Supabase Dashboard)
-- SELECT id, email, role FROM public.profiles LIMIT 5;
