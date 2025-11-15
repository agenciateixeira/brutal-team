-- ============================================
-- FIX: GARANTIR ACESSO VITALÍCIO PARA COACH ADMIN (V2)
-- ============================================

-- PASSO 1: Verificar se o coach existe
DO $$
DECLARE
  coach_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO coach_count
  FROM profiles
  WHERE email = 'coach@brutalteam.blog.br';

  IF coach_count = 0 THEN
    RAISE EXCEPTION '❌ ERRO: Coach não encontrado!';
  ELSE
    RAISE NOTICE '✅ Coach encontrado: coach@brutalteam.blog.br';
  END IF;
END $$;

-- PASSO 2: Atualizar o coach
UPDATE profiles
SET
  stripe_subscription_status = 'active',
  subscription_plan = 'empresarial',
  approved = true,
  updated_at = NOW()
WHERE email = 'coach@brutalteam.blog.br'
  AND role = 'coach';

-- PASSO 3: Verificar se atualizou
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

  IF v_status = 'active' AND v_plan = 'empresarial' THEN
    RAISE NOTICE '✅✅✅ SUCESSO! ACESSO VITALÍCIO CONFIGURADO';
    RAISE NOTICE '';
    RAISE NOTICE 'Email: coach@brutalteam.blog.br';
    RAISE NOTICE 'Status: % (deve ser "active")', v_status;
    RAISE NOTICE 'Plano: % (deve ser "empresarial")', v_plan;
  ELSE
    RAISE EXCEPTION '❌ ERRO: Campos não foram atualizados! Status: %, Plano: %', v_status, v_plan;
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- PASSO 4: Mostrar todos os dados atualizados
SELECT
  id,
  full_name,
  email,
  role,
  stripe_subscription_status,
  subscription_plan,
  approved,
  updated_at
FROM profiles
WHERE email = 'coach@brutalteam.blog.br';
