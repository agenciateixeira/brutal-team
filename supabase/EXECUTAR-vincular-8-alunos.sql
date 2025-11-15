-- ============================================
-- VINCULAR 8 ALUNOS AO COACH coach@brutalteam.blog.br
-- ============================================

-- PASSO 1: Verificar o ID do coach
SELECT
  id,
  full_name,
  email,
  role
FROM profiles
WHERE email = 'coach@brutalteam.blog.br'
  AND role = 'coach';

-- PASSO 2: Vincular os 8 alunos a este coach
UPDATE profiles
SET coach_id = (
  SELECT id
  FROM profiles
  WHERE email = 'coach@brutalteam.blog.br'
    AND role = 'coach'
  LIMIT 1
)
WHERE role = 'aluno'
  AND coach_id IS NULL;

-- PASSO 3: Verificar resultado
SELECT
  id,
  full_name,
  email,
  coach_id,
  (SELECT full_name FROM profiles p WHERE p.id = profiles.coach_id) AS coach_name
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NOT NULL
ORDER BY created_at DESC;

-- PASSO 4: Confirmar que não sobrou nenhum aluno sem coach
SELECT
  COUNT(*) AS alunos_ainda_sem_coach
FROM profiles
WHERE role = 'aluno'
  AND coach_id IS NULL;

-- Mensagem final
DO $$
DECLARE
  total_vinculados INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_vinculados
  FROM profiles
  WHERE role = 'aluno'
    AND coach_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ VINCULAÇÃO CONCLUÍDA!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total de alunos vinculados: %', total_vinculados;
  RAISE NOTICE '';
END $$;
