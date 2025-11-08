-- ============================================
-- 🔍 DIAGNÓSTICO REALTIME
-- ============================================
-- Problema: Realtime habilitado mas dá CHANNEL_ERROR
-- Possível causa: RLS bloqueando Realtime

-- ============================================
-- 1. VERIFICAR SE REALTIME ESTÁ HABILITADO
-- ============================================

SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'community%'
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR POLICIES DE SELECT
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE tablename IN ('community_posts', 'community_likes', 'community_comments')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- ============================================
-- 3. TESTAR SE CONSEGUE FAZER SELECT
-- ============================================

-- Teste simples de SELECT
SELECT
  id,
  caption,
  created_at,
  aluno_id
FROM community_posts
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 4. VERIFICAR RLS ESTÁ HABILITADO
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename LIKE 'community%'
  AND schemaname = 'public'
ORDER BY tablename;
