-- ============================================
-- CORRIGIR CAMPO 'approved' PARA NOVO SISTEMA
-- ============================================
-- Marcar alunos do novo sistema como approved
-- para garantir compatibilidade com qualquer
-- código legado que ainda use esse campo
-- ============================================

-- 1. Marcar alunos com first_access_completed como approved
UPDATE profiles
SET approved = TRUE
WHERE role = 'aluno'
AND first_access_completed = TRUE
AND (approved = FALSE OR approved IS NULL);

-- 2. Marcar alunos com coach_students como approved
UPDATE profiles
SET approved = TRUE
WHERE role = 'aluno'
AND id IN (
  SELECT student_id
  FROM coach_students
  WHERE status = 'active'
)
AND (approved = FALSE OR approved IS NULL);

-- 3. Verificar resultado
SELECT
  COUNT(*) FILTER (WHERE approved = TRUE) as alunos_aprovados,
  COUNT(*) FILTER (WHERE approved = FALSE OR approved IS NULL) as alunos_nao_aprovados,
  COUNT(*) as total_alunos
FROM profiles
WHERE role = 'aluno';
