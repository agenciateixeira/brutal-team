-- ============================================
-- 🔍 DIAGNÓSTICO DETALHADO DA REDE
-- ============================================

-- 1. VER TODOS OS ALUNOS COM SEUS CÓDIGOS DE INDICAÇÃO
SELECT
  id,
  full_name,
  email,
  referral_code,
  referred_by,
  CASE
    WHEN referred_by IS NULL THEN '🌱 RAIZ (sem indicador)'
    WHEN referred_by IS NOT NULL THEN '👥 INDICADO'
  END as status_rede
FROM profiles
WHERE role = 'aluno'
ORDER BY created_at;

-- 2. VER QUEM INDICOU QUEM (MAPEAMENTO COMPLETO)
SELECT
  p1.full_name as indicador,
  p1.referral_code as codigo_indicador,
  p2.full_name as indicado,
  p2.referred_by as codigo_usado,
  CASE
    WHEN p1.referral_code = p2.referred_by THEN '✅ LINK CORRETO'
    ELSE '❌ LINK QUEBRADO'
  END as status_link
FROM profiles p1
LEFT JOIN profiles p2 ON p1.referral_code = p2.referred_by
WHERE p1.role = 'aluno'
ORDER BY p1.created_at;

-- 3. SEU PERFIL COMPLETO
SELECT
  id,
  full_name,
  email,
  referral_code as meu_codigo,
  referred_by as codigo_quem_me_indicou
FROM profiles
WHERE id = auth.uid();

-- 4. QUEM VOCÊ INDICOU (DIRETO)
SELECT
  p.id,
  p.full_name,
  p.email,
  p.referred_by as usou_codigo
FROM profiles p
WHERE p.referred_by = (
  SELECT referral_code FROM profiles WHERE id = auth.uid()
)
AND p.role = 'aluno';

-- 5. QUEM TE INDICOU (SUBINDO 1 NÍVEL)
SELECT
  p.id,
  p.full_name,
  p.email,
  p.referral_code
FROM profiles p
WHERE p.referral_code = (
  SELECT referred_by FROM profiles WHERE id = auth.uid()
)
AND p.role = 'aluno';

-- 6. TESTAR FUNÇÃO DE REDE
SELECT
  p.id,
  p.full_name,
  p.email,
  p.referral_code,
  p.referred_by
FROM get_community_network(auth.uid()) network
INNER JOIN profiles p ON network.member_id = p.id
WHERE p.role = 'aluno';
