-- ============================================
-- VERIFICAR CONSTRAINT DE SUBSCRIPTION_PLAN
-- ============================================

-- Ver a definição da constraint
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles'
  AND con.conname LIKE '%subscription%';

-- Ver todos os check constraints da tabela profiles
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles'
  AND con.contype = 'c'; -- 'c' = CHECK constraint
