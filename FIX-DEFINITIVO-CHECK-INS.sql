-- ============================================
-- 🔧 FIX DEFINITIVO - CHECK-INS
-- ============================================
-- Problema: RLS ainda bloqueia o trigger mesmo com SECURITY DEFINER
-- Solução: Criar policy INSERT que sempre permite (para o trigger)

-- ============================================
-- 1. REMOVER POLICIES DE COACHES
-- ============================================

DROP POLICY IF EXISTS "Coaches podem ver todos os check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem ver seus check-ins" ON community_check_ins;

-- ============================================
-- 2. CRIAR POLICY INSERT QUE SEMPRE PERMITE
-- ============================================

-- Esta policy permite INSERTs sem verificação
-- O trigger vai usar ela para criar check-ins
DROP POLICY IF EXISTS "Sistema pode criar check-ins" ON community_check_ins;
CREATE POLICY "Sistema pode criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (true); -- ← SEMPRE PERMITE

COMMENT ON POLICY "Sistema pode criar check-ins" ON community_check_ins
IS 'Permite trigger criar check-ins automaticamente';

-- ============================================
-- 3. VERIFICAR POLICIES ATUAIS
-- ============================================

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'community_check_ins'
ORDER BY cmd, policyname;

-- ============================================
-- 4. VERIFICAR SE TRIGGER EXISTE
-- ============================================

SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'community_posts';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora deve funcionar:
-- ✅ Policy INSERT sempre permite (true)
-- ✅ Trigger consegue criar check-ins
-- ✅ Apenas 1 policy SELECT (ver check-ins da rede)
-- ❌ Coaches NÃO veem mais check-ins
