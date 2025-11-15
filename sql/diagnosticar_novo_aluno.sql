-- ============================================
-- DIAGNÓSTICO: Novo Aluno sem Dashboard
-- ============================================

-- PASSO 1: Ver TODOS os alunos e seu status
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.approved,
  p.first_access_completed,
  p.created_at,
  CASE
    WHEN p.approved = false THEN '❌ NÃO APROVADO'
    WHEN p.approved IS NULL THEN '⚠️ APROVAÇÃO NULL'
    ELSE '✅ APROVADO'
  END as status_aprovacao,
  CASE
    WHEN p.first_access_completed = false THEN '❌ PRIMEIRO ACESSO PENDENTE'
    WHEN p.first_access_completed IS NULL THEN '⚠️ PRIMEIRO ACESSO NULL'
    ELSE '✅ PRIMEIRO ACESSO OK'
  END as status_primeiro_acesso
FROM profiles p
WHERE p.role = 'aluno'
ORDER BY p.created_at DESC
LIMIT 10;

-- PASSO 2: Verificar user_stats dos alunos
SELECT
  p.full_name,
  p.email,
  CASE WHEN us.aluno_id IS NOT NULL THEN '✅ TEM USER_STATS' ELSE '❌ SEM USER_STATS' END as status_stats,
  us.total_workouts,
  us.current_streak,
  us.total_active_days
FROM profiles p
LEFT JOIN user_stats us ON p.id = us.aluno_id
WHERE p.role = 'aluno'
ORDER BY p.created_at DESC
LIMIT 10;

-- PASSO 3: Pegar o aluno mais recente (criado agora)
DO $$
DECLARE
  newest_aluno_id UUID;
  newest_aluno_name TEXT;
  newest_aluno_email TEXT;
  is_approved BOOLEAN;
  has_first_access BOOLEAN;
  has_stats BOOLEAN;
BEGIN
  -- Pegar aluno mais recente
  SELECT id, full_name, email, approved, first_access_completed
  INTO newest_aluno_id, newest_aluno_name, newest_aluno_email, is_approved, has_first_access
  FROM profiles
  WHERE role = 'aluno'
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE '============================================';
  RAISE NOTICE '🔍 DIAGNÓSTICO DO ALUNO MAIS RECENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Nome: %', newest_aluno_name;
  RAISE NOTICE 'Email: %', newest_aluno_email;
  RAISE NOTICE 'ID: %', newest_aluno_id;
  RAISE NOTICE '';

  -- Verificar aprovação
  IF is_approved = false OR is_approved IS NULL THEN
    RAISE NOTICE '❌ PROBLEMA 1: Aluno NÃO está aprovado (approved = %)', is_approved;
    RAISE NOTICE '   Solução: UPDATE profiles SET approved = true WHERE id = ''%'';', newest_aluno_id;
  ELSE
    RAISE NOTICE '✅ Aluno está aprovado';
  END IF;

  -- Verificar primeiro acesso
  IF has_first_access = false OR has_first_access IS NULL THEN
    RAISE NOTICE '⚠️  Primeiro acesso ainda não foi completado (first_access_completed = %)', has_first_access;
  ELSE
    RAISE NOTICE '✅ Primeiro acesso completado';
  END IF;

  -- Verificar user_stats
  SELECT EXISTS(SELECT 1 FROM user_stats WHERE aluno_id = newest_aluno_id) INTO has_stats;

  IF NOT has_stats THEN
    RAISE NOTICE '❌ PROBLEMA 2: Aluno NÃO tem user_stats';
    RAISE NOTICE '   Solução: INSERT INTO user_stats (aluno_id) VALUES (''%'');', newest_aluno_id;
  ELSE
    RAISE NOTICE '✅ Aluno tem user_stats';
  END IF;

  RAISE NOTICE '============================================';
END$$;

-- PASSO 4: CORRIGIR AUTOMATICAMENTE o aluno mais recente
DO $$
DECLARE
  newest_aluno_id UUID;
BEGIN
  -- Pegar aluno mais recente
  SELECT id INTO newest_aluno_id
  FROM profiles
  WHERE role = 'aluno'
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '🔧 APLICANDO CORREÇÕES AUTOMÁTICAS...';
  RAISE NOTICE '';

  -- Corrigir aprovação
  UPDATE profiles
  SET approved = true
  WHERE id = newest_aluno_id AND (approved = false OR approved IS NULL);

  IF FOUND THEN
    RAISE NOTICE '✅ Aluno aprovado automaticamente';
  END IF;

  -- Criar user_stats se não existir
  INSERT INTO user_stats (aluno_id)
  VALUES (newest_aluno_id)
  ON CONFLICT (aluno_id) DO NOTHING;

  IF FOUND THEN
    RAISE NOTICE '✅ user_stats criado automaticamente';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ CORREÇÕES APLICADAS!';
  RAISE NOTICE '   Agora peça para o aluno fazer LOGOUT e LOGIN novamente';
  RAISE NOTICE '';
END$$;

-- PASSO 5: Verificar resultado final
SELECT
  p.full_name,
  p.email,
  p.approved as esta_aprovado,
  p.first_access_completed,
  CASE WHEN us.aluno_id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_user_stats,
  CASE WHEN cm.aluno_id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as esta_na_comunidade
FROM profiles p
LEFT JOIN user_stats us ON p.id = us.aluno_id
LEFT JOIN community_members cm ON p.id = cm.aluno_id
  AND cm.community_id = '00000000-0000-0000-0000-000000000001'
WHERE p.role = 'aluno'
ORDER BY p.created_at DESC
LIMIT 5;
