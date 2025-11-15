-- ============================================
-- FIX: Políticas RLS para Supabase Storage
-- Permitir upload de fotos de primeiro acesso
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor

-- 1. Remover TODAS as políticas antigas do bucket progress-photos
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 2. Política para UPLOAD (INSERT) - Alunos podem fazer upload apenas em suas pastas
CREATE POLICY "Alunos podem fazer upload de suas fotos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (
      -- Permitir upload em first-access/{aluno_id}/
      (
        (storage.foldername(name))[1] = 'first-access'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      -- Permitir upload em weekly-photos/{aluno_id}/
      (
        (storage.foldername(name))[1] = 'weekly-photos'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      -- Permitir upload direto em {aluno_id}/ (formato antigo - retrocompatibilidade)
      (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- 3. Política para LEITURA (SELECT) - Alunos podem ver apenas suas fotos
CREATE POLICY "Alunos podem ver suas próprias fotos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (
      -- Ver suas fotos de first-access
      (
        (storage.foldername(name))[1] = 'first-access'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      -- Ver suas fotos de progresso semanal
      (
        (storage.foldername(name))[1] = 'weekly-photos'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR
      -- Ver fotos no formato antigo {aluno_id}/
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Coaches podem ver TODAS as fotos
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin')
      )
    )
  );

-- 4. Política para ATUALIZAÇÃO (UPDATE) - Permitir atualizar metadados
CREATE POLICY "Usuários podem atualizar metadados de suas fotos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (
      -- Formato com subpasta: first-access/{aluno_id}/ ou weekly-photos/{aluno_id}/
      (storage.foldername(name))[2] = auth.uid()::text
      OR
      -- Formato antigo: {aluno_id}/
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Coaches podem atualizar qualquer foto
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coach', 'admin')
      )
    )
  );

-- 5. Política para DELEÇÃO (DELETE) - Apenas coaches podem deletar
CREATE POLICY "Coaches podem deletar fotos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Verificar políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ✅ Políticas RLS do Storage configuradas!
