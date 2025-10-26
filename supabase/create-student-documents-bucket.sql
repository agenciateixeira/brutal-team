-- ============================================
-- CRIAR BUCKET PARA DOCUMENTOS DOS ALUNOS
-- Armazena PDFs de dietas e treinos
-- ============================================

-- Criar bucket público para documentos dos alunos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  true,
  10485760, -- 10MB em bytes
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies para o bucket

-- 1. Permitir coaches fazer upload
CREATE POLICY "Coaches podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- 2. Permitir coaches deletar documentos
CREATE POLICY "Coaches podem deletar documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- 3. Permitir coaches visualizar documentos
CREATE POLICY "Coaches podem visualizar todos os documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- 4. Permitir alunos visualizar apenas seus próprios documentos
CREATE POLICY "Alunos podem visualizar seus próprios documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- ✅ Bucket criado com sucesso!
-- Os coaches podem fazer upload de PDFs (máximo 10MB)
-- Os alunos podem visualizar apenas seus próprios arquivos
