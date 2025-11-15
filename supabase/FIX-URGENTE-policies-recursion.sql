-- ============================================
-- FIX URGENTE: CORRIGIR POLÍTICAS RLS COM RECURSÃO
-- ============================================
-- As políticas anteriores causavam erro 500 por recursão
-- Esta versão usa funções helper para evitar o problema
-- ============================================

-- PASSO 1: Dropar todas as políticas problemáticas
DROP POLICY IF EXISTS "Coaches can view their own alunos" ON profiles;
DROP POLICY IF EXISTS "Alunos can view own profile and their coach" ON profiles;
DROP POLICY IF EXISTS "Coaches can update their own alunos" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- PASSO 2: Criar funções helper para evitar recursão

-- Função para verificar se usuário é coach
CREATE OR REPLACE FUNCTION is_coach(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'coach'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para pegar o coach_id de um aluno
CREATE OR REPLACE FUNCTION get_user_coach_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  SELECT coach_id INTO v_coach_id
  FROM profiles
  WHERE id = user_id;
  RETURN v_coach_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASSO 3: Criar políticas RLS simples e seguras

-- Política 1: Usuários veem seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Coaches veem perfis de seus alunos
CREATE POLICY "Coaches can view their alunos"
  ON profiles FOR SELECT
  USING (coach_id = auth.uid());

-- Política 3: Alunos veem o perfil de seu coach
CREATE POLICY "Alunos can view their coach"
  ON profiles FOR SELECT
  USING (id = get_user_coach_id(auth.uid()));

-- Política 4: Usuários atualizam seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política 5: Coaches atualizam perfis de seus alunos
CREATE POLICY "Coaches can update their alunos"
  ON profiles FOR UPDATE
  USING (coach_id = auth.uid());

-- PASSO 4: Verificar políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- PASSO 5: Testar se consegue ler o próprio perfil
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ POLÍTICAS RLS CORRIGIDAS!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas criadas sem recursão:';
  RAISE NOTICE '1. Users can view own profile';
  RAISE NOTICE '2. Coaches can view their alunos';
  RAISE NOTICE '3. Alunos can view their coach';
  RAISE NOTICE '4. Users can update own profile';
  RAISE NOTICE '5. Coaches can update their alunos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Teste agora fazendo login!';
  RAISE NOTICE '';
END $$;
