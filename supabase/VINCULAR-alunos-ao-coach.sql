-- ============================================
-- VINCULAR ALUNOS EXISTENTES A UM COACH
-- ============================================
-- IMPORTANTE: Este script vincula TODOS os alunos sem coach_id
-- ao PRIMEIRO coach encontrado no banco
-- ============================================

-- PASSO 1: Ver qual coach será usado
SELECT
  id,
  full_name,
  email,
  role
FROM profiles
WHERE role = 'coach'
LIMIT 1;

-- PASSO 2: Descomentar e executar para vincular todos os alunos a este coach
/*
UPDATE profiles
SET coach_id = (
  SELECT id FROM profiles WHERE role = 'coach' LIMIT 1
)
WHERE role = 'aluno'
  AND coach_id IS NULL;
*/

-- PASSO 3: Verificar resultado
SELECT
  COUNT(*) AS alunos_vinculados
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NOT NULL;

SELECT
  COUNT(*) AS alunos_ainda_sem_coach
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NULL;
