-- ============================================
-- CORRIGIR APROVAÇÃO DE ALUNO
-- ============================================
-- Execute este SQL para aprovar manualmente um aluno que está com problema

-- 1. Ver alunos pendentes (copie o ID do aluno que precisa aprovar)
SELECT id, email, full_name, approved, payment_status, created_at
FROM profiles
WHERE role = 'aluno' AND approved = false
ORDER BY created_at DESC;

-- 2. APROVAR ALUNO (substitua 'COLE_O_ID_AQUI' pelo ID do aluno)
-- UPDATE profiles
-- SET
  approved = true,
  -- payment_status = 'confirmed'  -- Descomente se quiser marcar pagamento como confirmado também
-- WHERE id = 'COLE_O_ID_AQUI';

-- 3. Adicionar à comunidade pública (se não estiver)
-- INSERT INTO community_members (community_id, aluno_id, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'COLE_O_ID_AQUI', 'member')
-- ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- 4. Verificar se foi aprovado
-- SELECT id, email, full_name, approved, payment_status
-- FROM profiles
-- WHERE id = 'COLE_O_ID_AQUI';


-- ============================================
-- EXEMPLO DE USO COMPLETO
-- ============================================
-- Substitua 'abc123-xyz-etc' pelo ID real do aluno

/*
-- Passo 1: Verificar o aluno
SELECT id, email, full_name, approved FROM profiles
WHERE email = 'email-do-aluno@exemplo.com';

-- Passo 2: Aprovar
UPDATE profiles
SET approved = true, payment_status = 'confirmed'
WHERE id = 'abc123-xyz-etc';

-- Passo 3: Adicionar à comunidade
INSERT INTO community_members (community_id, aluno_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'abc123-xyz-etc', 'member')
ON CONFLICT (community_id, aluno_id) DO NOTHING;

-- Passo 4: Confirmar
SELECT id, email, approved, payment_status FROM profiles
WHERE id = 'abc123-xyz-etc';
*/
