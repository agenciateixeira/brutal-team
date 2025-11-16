-- ============================================
-- CORRIGIR POLICIES DE LEITURA DA TABELA PROFILES
-- ============================================
-- Permite que qualquer usuário autenticado leia profiles por email

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Users can read all profiles by email" ON profiles;

-- Criar policy que permite leitura por email para usuários autenticados
CREATE POLICY "Users can read profiles by email"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Verificar policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
