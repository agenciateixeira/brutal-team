-- ============================================
-- 🔍 DIAGNÓSTICO DA REDE
-- ============================================
-- Execute este SQL para ver o estado atual da rede

-- 1. Ver todos os perfis com seus referrals
SELECT
  id,
  full_name,
  email,
  role,
  referral_code,
  referred_by,
  created_at
FROM profiles
WHERE role = 'aluno'
ORDER BY created_at;

-- 2. Testar função de rede para o usuário atual
-- (Substitua YOUR_USER_ID pelo seu ID)
SELECT * FROM get_community_network(auth.uid());

-- 3. Ver quantas pessoas estão na sua rede
SELECT COUNT(*) as total_na_rede
FROM get_community_network(auth.uid());

-- 4. Ver posts existentes
SELECT
  cp.id,
  cp.caption,
  cp.photo_url,
  cp.workout_type,
  cp.created_at,
  p.full_name as autor
FROM community_posts cp
INNER JOIN profiles p ON cp.aluno_id = p.id
ORDER BY cp.created_at DESC;
