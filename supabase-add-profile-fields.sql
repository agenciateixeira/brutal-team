-- Add phone_number and avatar_url to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to allow users to update their own phone and avatar
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;

-- Create update policy
CREATE POLICY "allow_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- IMPORTANTE: Depois de executar este SQL, você precisa criar o bucket de avatares:
-- 1. Vá em Storage no Supabase
-- 2. Crie um novo bucket chamado "avatars"
-- 3. Deixe o bucket como PUBLIC
-- 4. Adicione as seguintes políticas no bucket "avatars":
--    - SELECT: authenticated users can view
--    - INSERT: authenticated users can upload
--    - UPDATE: authenticated users can update their own files
--    - DELETE: authenticated users can delete their own files
