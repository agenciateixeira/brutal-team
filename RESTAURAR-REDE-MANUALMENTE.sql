-- ============================================
-- 🔧 RESTAURAR REDE DE INDICAÇÕES MANUALMENTE
-- ============================================
-- Problema: referred_by está NULL para todos
-- Solução: Restaurar os links baseado em quem realmente indicou quem

-- ============================================
-- 1. RESTAURAR LINKS DE INDICAÇÃO
-- ============================================

-- Diego foi indicado por Guilherme
UPDATE profiles
SET referred_by = 'BRUTAL-9BEFF7'
WHERE full_name = 'Diego de Jesus Botelho'
  AND role = 'aluno';

-- Vitor foi indicado por Guilherme
UPDATE profiles
SET referred_by = 'BRUTAL-9BEFF7'
WHERE full_name = 'Vitor hugo marani'
  AND role = 'aluno';

-- ============================================
-- 2. VERIFICAR SE OS LINKS FORAM RESTAURADOS
-- ============================================

SELECT
  full_name,
  referral_code as meu_codigo,
  referred_by as codigo_do_indicador,
  CASE
    WHEN referred_by IS NULL THEN '🌱 RAIZ (ninguém indicou)'
    WHEN referred_by = 'BRUTAL-9BEFF7' THEN '✅ INDICADO POR GUILHERME'
    ELSE '👥 INDICADO POR OUTRO'
  END as status
FROM profiles
WHERE role = 'aluno'
ORDER BY created_at;

-- ============================================
-- 3. TESTAR MAPEAMENTO DE REDE
-- ============================================

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

-- ============================================
-- 4. TESTAR FUNÇÃO DE REDE PARA GUILHERME
-- ============================================

-- Buscar ID do Guilherme
SELECT
  p.full_name,
  p.email,
  p.referral_code,
  p.referred_by
FROM get_community_network((SELECT id FROM profiles WHERE full_name = 'Guilherme Teixeira')) network
INNER JOIN profiles p ON network.member_id = p.id
WHERE p.role = 'aluno';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Agora a rede deve funcionar:
-- ✅ Guilherme (você) - raiz
-- ✅ Diego - indicado por você
-- ✅ Vitor - indicado por você
-- ✅ Função de rede retorna os 3
