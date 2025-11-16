-- ============================================
-- TORNAR GUILHERME ADMINISTRADOR
-- ============================================
-- Atualiza o role do guilherme@agenciagtx.com.br para 'admin'
-- ============================================

-- 1. Adicionar 'admin' ao enum se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
END$$;

-- 2. Atualizar o perfil para admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'guilherme@agenciagtx.com.br';

-- 3. Verificar se foi atualizado
SELECT
  'PERFIL_ATUALIZADO' as status,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'guilherme@agenciagtx.com.br';
