-- Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Avatars são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus avatares" ON storage.objects;

-- Política: Permitir que usuários autenticados vejam avatares
CREATE POLICY "Avatars são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: Permitir upload de avatares para usuários autenticados
CREATE POLICY "Usuários podem fazer upload de avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política: Permitir que usuários atualizem seus próprios avatares
CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars');

-- Política: Permitir que usuários deletem seus próprios avatares
CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());
