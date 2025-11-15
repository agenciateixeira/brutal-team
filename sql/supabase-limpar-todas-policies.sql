-- REMOVER TODAS AS POLÍTICAS (independente do nome)
-- Execute este script primeiro

-- Remover todas as políticas da tabela profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Remover todas as políticas da tabela progress_photos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'progress_photos') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON progress_photos';
    END LOOP;
END $$;

-- Remover todas as políticas da tabela messages
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
    END LOOP;
END $$;

-- Remover todas as políticas da tabela dietas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'dietas') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON dietas';
    END LOOP;
END $$;

-- Remover todas as políticas da tabela treinos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'treinos') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON treinos';
    END LOOP;
END $$;

SELECT 'Todas as políticas removidas!' as status;
