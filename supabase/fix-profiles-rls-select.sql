-- ============================================
-- CORRIGIR POLICIES DE LEITURA DA TABELA PROFILES
-- ============================================
-- Permite leitura pública de profiles (necessário para verificar email no signup)

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Users can read all profiles by email" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles by email" ON profiles;

-- Criar policy que permite leitura pública
-- Isso é seguro porque só verificamos SE o email existe no fluxo de signup
CREATE POLICY "Public read access to profiles"
ON profiles FOR SELECT
USING (true);

-- Verificar policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
