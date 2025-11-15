-- ========================================
-- DIAGNÓSTICO PUSH NOTIFICATIONS COMUNIDADE
-- ========================================

-- 1. Ver último post criado
SELECT
  cp.id,
  cp.author_id,
  p.full_name as author_name,
  cp.community_id,
  c.name as community_name,
  cp.content,
  cp.created_at
FROM community_posts cp
LEFT JOIN profiles p ON p.id = cp.author_id
LEFT JOIN communities c ON c.id = cp.community_id
ORDER BY cp.created_at DESC
LIMIT 5;

-- 2. Ver membros da comunidade do último post
WITH last_post AS (
  SELECT community_id, author_id
  FROM community_posts
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  cm.aluno_id,
  p.full_name,
  p.email,
  np.push_notifications,
  np.community_notifications,
  CASE
    WHEN cm.aluno_id = lp.author_id THEN 'AUTOR (não deve receber)'
    WHEN np.push_notifications IS TRUE AND np.community_notifications IS TRUE THEN 'DEVE RECEBER'
    ELSE 'NÃO DEVE RECEBER'
  END as status
FROM last_post lp
JOIN community_members cm ON cm.community_id = lp.community_id
JOIN profiles p ON p.id = cm.aluno_id
LEFT JOIN notification_preferences np ON np.user_id = cm.aluno_id
ORDER BY cm.created_at;

-- 3. Ver preferências de notificação de todos os usuários
SELECT
  p.id,
  p.full_name,
  p.email,
  COALESCE(np.push_notifications, false) as push_notifications,
  COALESCE(np.community_notifications, false) as community_notifications
FROM profiles p
LEFT JOIN notification_preferences np ON np.user_id = p.id
WHERE p.role = 'aluno'
ORDER BY p.full_name;

-- 4. Tentar criar uma notificação de teste manualmente
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Pegar o primeiro aluno
  SELECT id INTO v_test_user_id
  FROM profiles
  WHERE role = 'aluno'
  LIMIT 1;

  -- Inserir notificação de teste
  INSERT INTO notifications (user_id, title, message, type, read, link, data)
  VALUES (
    v_test_user_id,
    '🧪 Teste de Push',
    'Esta é uma notificação de teste criada manualmente',
    'test',
    false,
    '/aluno/comunidade',
    jsonb_build_object('test', true)
  );

  RAISE NOTICE 'Notificação de teste criada para usuário %', v_test_user_id;
END $$;

-- 5. Ver notificações criadas nos últimos 5 minutos
SELECT
  n.id,
  n.user_id,
  p.full_name,
  n.title,
  n.message,
  n.type,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;
