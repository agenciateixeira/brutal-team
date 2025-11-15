-- ============================================
-- Verificar Alunos Pendentes de Aprovação
-- ============================================

-- Ver todos os alunos não aprovados
SELECT
  id,
  email,
  full_name,
  role,
  approved,
  created_at,
  payment_status
FROM profiles
WHERE role = 'aluno' AND approved = false
ORDER BY created_at DESC;

-- Ver alunos criados nas últimas 24 horas
SELECT
  id,
  email,
  full_name,
  role,
  approved,
  created_at,
  payment_status
FROM profiles
WHERE role = 'aluno' AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar se o trigger de auto-adicionar à comunidade pública existe
SELECT
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_add_to_public_community';

-- Verificar membros da comunidade pública
SELECT
  cm.aluno_id,
  p.email,
  p.full_name,
  p.approved,
  cm.joined_at
FROM community_members cm
JOIN profiles p ON cm.aluno_id = p.id
WHERE cm.community_id = '00000000-0000-0000-0000-000000000001'
ORDER BY cm.joined_at DESC
LIMIT 10;
