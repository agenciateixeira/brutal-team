-- ============================================
-- 🔍 VER CÓDIGOS EXATOS E CORRIGIR
-- ============================================

-- 1. VER CÓDIGOS COM ASPAS (para detectar espaços)
SELECT
  id,
  full_name,
  '"' || referral_code || '"' as codigo_com_aspas,
  '"' || COALESCE(referred_by, 'NULL') || '"' as referred_by_com_aspas,
  LENGTH(referral_code) as tamanho_codigo,
  LENGTH(COALESCE(referred_by, '')) as tamanho_referred_by
FROM profiles
WHERE role = 'aluno'
ORDER BY created_at;

-- 2. VERIFICAR SE HÁ PROBLEMA DE ESPAÇOS EM BRANCO
SELECT
  id,
  full_name,
  referral_code,
  referred_by,
  CASE
    WHEN referral_code != TRIM(referral_code) THEN '⚠️ TEM ESPAÇOS NO CÓDIGO'
    WHEN referred_by IS NOT NULL AND referred_by != TRIM(referred_by) THEN '⚠️ TEM ESPAÇOS NO REFERRED_BY'
    ELSE '✅ OK'
  END as status_espacos
FROM profiles
WHERE role = 'aluno';

-- 3. CORRIGIR ESPAÇOS EM BRANCO (se houver)
UPDATE profiles
SET
  referral_code = TRIM(referral_code),
  referred_by = TRIM(referred_by)
WHERE role = 'aluno'
  AND (
    referral_code != TRIM(referral_code)
    OR referred_by != TRIM(referred_by)
  );

-- 4. VERIFICAR LINKS APÓS CORREÇÃO
SELECT
  p1.full_name as indicador,
  p1.referral_code as codigo_indicador,
  p2.full_name as indicado,
  p2.referred_by as codigo_usado,
  CASE
    WHEN p1.referral_code = p2.referred_by THEN '✅ LINK CORRETO'
    ELSE '❌ AINDA QUEBRADO'
  END as status_link
FROM profiles p1
LEFT JOIN profiles p2 ON p1.referral_code = p2.referred_by
WHERE p1.role = 'aluno'
ORDER BY p1.created_at;

-- 5. TESTAR FUNÇÃO DE REDE NOVAMENTE
SELECT
  p.full_name,
  p.email,
  p.referral_code,
  p.referred_by
FROM get_community_network(auth.uid()) network
INNER JOIN profiles p ON network.member_id = p.id
WHERE p.role = 'aluno';
