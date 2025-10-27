-- ============================================
-- FIX: Marcar alunos antigos como tendo completado primeiro acesso
-- Execute este script para evitar que o modal apareça para alunos antigos
-- ============================================

-- Marcar todos os alunos aprovados ANTES da implementação do sistema de primeiro acesso
-- como tendo completado o primeiro acesso
UPDATE profiles
SET
  first_access_completed = TRUE,
  first_access_photos_uploaded = TRUE,
  first_access_at = created_at
WHERE
  role = 'aluno'
  AND approved = TRUE
  AND (first_access_completed IS NULL OR first_access_completed = FALSE)
  -- Adicionar condição para alunos criados antes de hoje (ou antes da implementação)
  AND created_at < '2025-10-26'::timestamp;

-- Verificar quantos alunos foram atualizados
SELECT
  COUNT(*) as alunos_atualizados,
  'Alunos antigos marcados como primeiro acesso completo' as status
FROM profiles
WHERE
  role = 'aluno'
  AND approved = TRUE
  AND first_access_completed = TRUE
  AND created_at < '2025-10-26'::timestamp;
