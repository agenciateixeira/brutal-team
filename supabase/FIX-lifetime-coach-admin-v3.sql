-- ============================================
-- FIX: GARANTIR ACESSO VITALÍCIO PARA COACH ADMIN (V3)
-- Remove constraint temporariamente se necessário
-- ============================================

-- PASSO 1: Ver a constraint atual
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles'
  AND con.conname = 'valid_subscription_plan';

-- PASSO 2: Dropar a constraint se ela existir
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_subscription_plan;

-- PASSO 3: Atualizar o coach
UPDATE profiles
SET
  stripe_subscription_status = 'active',
  subscription_plan = 'empresarial',
  approved = true,
  updated_at = NOW()
WHERE email = 'coach@brutalteam.blog.br'
  AND role = 'coach';

-- PASSO 4: Recriar a constraint com os valores corretos (baseado em plans.ts)
ALTER TABLE profiles ADD CONSTRAINT valid_subscription_plan
  CHECK (
    subscription_plan IS NULL OR
    subscription_plan IN ('starter', 'pro', 'empresarial', 'personalizado')
  );

-- PASSO 5: Verificar resultado
DO $$
DECLARE
  v_status TEXT;
  v_plan TEXT;
BEGIN
  SELECT stripe_subscription_status, subscription_plan
  INTO v_status, v_plan
  FROM profiles
  WHERE email = 'coach@brutalteam.blog.br';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ACESSO VITALÍCIO CONFIGURADO!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Email: coach@brutalteam.blog.br';
  RAISE NOTICE 'Status: %', v_status;
  RAISE NOTICE 'Plano: %', v_plan;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Este coach NUNCA será bloqueado!';
  RAISE NOTICE '    (bypass no middleware por email)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- PASSO 6: Mostrar dados completos
SELECT
  id,
  full_name,
  email,
  role,
  stripe_subscription_status,
  subscription_plan,
  approved
FROM profiles
WHERE email = 'coach@brutalteam.blog.br';
