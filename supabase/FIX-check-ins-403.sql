-- ============================================
-- FIX: Erro 403 ao criar check-in
-- ============================================
-- Erro: "new row violates row-level security policy for table community_check_ins"
-- Causa: Policy de INSERT bloqueando criação de check-ins

-- 1. Verificar policies existentes
SELECT
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_check_ins';

-- 2. DROPAR todas as policies existentes
DROP POLICY IF EXISTS "Alunos podem ver seus check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem criar check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem ver check-ins da rede" ON community_check_ins;
DROP POLICY IF EXISTS "Coaches podem ver todos os check-ins" ON community_check_ins;

-- 3. RECRIAR policy de INSERT (PERMITIR que aluno crie check-in para si mesmo)
CREATE POLICY "Alunos podem criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (
  auth.uid() = community_check_ins.aluno_id
);

-- 4. Policy de SELECT para ver próprios check-ins
CREATE POLICY "Alunos podem ver seus check-ins"
ON community_check_ins FOR SELECT
USING (
  auth.uid() = community_check_ins.aluno_id
);

-- 5. Policy para ver check-ins da rede
CREATE POLICY "Alunos podem ver check-ins da rede"
ON community_check_ins FOR SELECT
USING (
  community_check_ins.aluno_id IN (
    SELECT net.member_id
    FROM get_community_network(auth.uid()) net
  )
);

-- 6. Policy para coaches verem tudo
CREATE POLICY "Coaches podem ver todos os check-ins"
ON community_check_ins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles prof
    WHERE prof.id = auth.uid()
    AND prof.role = 'coach'
  )
);

-- 7. Garantir RLS está ativado
ALTER TABLE community_check_ins ENABLE ROW LEVEL SECURITY;

-- 8. Verificar estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_check_ins'
ORDER BY ordinal_position;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FIX APLICADO COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies community_check_ins recriadas:';
  RAISE NOTICE '  ✓ INSERT: alunos podem criar check-ins para si mesmos';
  RAISE NOTICE '  ✓ SELECT: alunos podem ver seus check-ins';
  RAISE NOTICE '  ✓ SELECT: alunos podem ver check-ins da rede';
  RAISE NOTICE '  ✓ SELECT: coaches podem ver tudo';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Tente postar treino novamente!';
  RAISE NOTICE '';
END $$;
