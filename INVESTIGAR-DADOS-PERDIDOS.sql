-- ============================================
-- 🔍 INVESTIGAR DADOS PERDIDOS
-- ============================================

-- 1. VER SE HÁ ALGUMA TABELA DE HISTÓRICO OU AUDITORIA
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%audit%'
  OR table_name LIKE '%history%'
  OR table_name LIKE '%log%';

-- 2. VER TODAS AS TABELAS DO SCHEMA PUBLIC
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. VERIFICAR SE HÁ DADOS EM OUTRAS TABELAS RELACIONADAS
-- (talvez tenhamos referrals em outra tabela)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%referral%'
    OR table_name LIKE '%network%'
    OR table_name LIKE '%indicator%'
  );

-- 4. VER TODOS OS PERFIS ATUAIS (estado atual)
SELECT
  id,
  full_name,
  email,
  referral_code,
  referred_by,
  created_at,
  updated_at
FROM profiles
WHERE role = 'aluno'
ORDER BY created_at;

-- 5. VERIFICAR SE PROFILES TEM SOFT DELETE (deleted_at)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
