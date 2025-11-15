-- ============================================
-- VERIFICAR SE EXISTE COACH_ID NA TABELA PROFILES
-- ============================================

-- Verificar se a coluna coach_id existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'coach_id'
    ) THEN 'coach_id JÁ EXISTE ✅'
    ELSE 'coach_id NÃO EXISTE ❌'
  END AS status;

-- Listar todas as colunas relacionadas a coach
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name LIKE '%coach%'
ORDER BY ordinal_position;

-- Verificar se existem políticas RLS para coach_id
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND (
    qual LIKE '%coach_id%'
    OR with_check LIKE '%coach_id%'
  );
