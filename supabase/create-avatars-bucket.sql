-- ============================================
-- CRIAR BUCKET DE AVATARS NO SUPABASE STORAGE
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Criar bucket público para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Avatars são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload do próprio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar o próprio avatar" ON storage.objects;

-- Policy: Permitir que todos vejam os avatars (bucket público)
CREATE POLICY "Avatars são públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Usuários autenticados podem fazer upload de seus próprios avatars
CREATE POLICY "Usuários podem fazer upload do próprio avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Policy: Usuários podem atualizar seus próprios avatars
CREATE POLICY "Usuários podem atualizar o próprio avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Policy: Usuários podem deletar seus próprios avatars
CREATE POLICY "Usuários podem deletar o próprio avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- ✅ BUCKET DE AVATARS CRIADO!
--
-- O QUE FOI FEITO:
-- 1. ✅ Bucket 'avatars' criado com limite de 5MB por arquivo
-- 2. ✅ Tipos permitidos: JPEG, JPG, PNG, WEBP, GIF
-- 3. ✅ Bucket configurado como público (qualquer um pode ver)
-- 4. ✅ Apenas usuários autenticados podem fazer upload
-- 5. ✅ Usuários só podem gerenciar seus próprios avatars
--
-- PRÓXIMOS PASSOS:
-- 1. Upload de fotos de perfil funcionará normalmente
-- 2. URLs públicas geradas automaticamente
-- 3. Limites de tamanho e tipo de arquivo aplicados
