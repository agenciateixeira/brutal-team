-- ========================================
-- CRIAR BUCKET DE STORAGE PARA AVATARES
-- Execute este SQL no Supabase Dashboard
-- ========================================

-- 1. Criar bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de acesso para o bucket
-- Permitir leitura pública
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

-- Permitir upload apenas para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Permitir usuários atualizarem seus próprios arquivos
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir usuários deletarem seus próprios arquivos
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Verificar se foi criado
SELECT * FROM storage.buckets WHERE id = 'public';
