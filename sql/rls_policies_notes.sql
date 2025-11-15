-- ============================================
-- POLÍTICAS RLS (Row Level Security) - NOTAS
-- ============================================

-- IMPORTANTE: As API routes usam SUPABASE_SERVICE_ROLE_KEY que bypassa RLS
-- Portanto, as políticas abaixo são apenas para operações client-side

-- Política para coaches visualizarem alunos pendentes
CREATE POLICY "Coaches podem ver alunos pendentes"
  ON public.profiles
  FOR SELECT
  USING (
    role = 'aluno' AND
    (
      approved = true OR
      EXISTS (
        SELECT 1 FROM public.profiles coach
        WHERE coach.id = auth.uid() AND coach.role = 'coach'
      )
    )
  );

-- NOTA: Não é necessário criar política de UPDATE para coaches
-- pois a aprovação acontece via API route com service role key

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
