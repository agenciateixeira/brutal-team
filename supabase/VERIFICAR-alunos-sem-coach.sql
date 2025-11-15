-- ============================================
-- VERIFICAR ALUNOS SEM COACH_ID
-- ============================================

SELECT
  id,
  full_name,
  email,
  coach_id,
  approved,
  created_at
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NULL
ORDER BY created_at DESC;

-- Contar total
SELECT
  COUNT(*) AS alunos_sem_coach
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NULL;
