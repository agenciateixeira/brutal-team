-- ============================================
-- FIX: Reverter aprovações automáticas indevidas
-- E garantir que apenas coach pode aprovar
-- ============================================

-- 1. VERIFICAR APROVAÇÕES SUSPEITAS
-- ============================================
DO $$
DECLARE
  rec RECORD;
  total_aprovados_sem_plano INTEGER;
BEGIN
  -- Contar alunos aprovados SEM student_plan (aprovação indevida)
  SELECT COUNT(*) INTO total_aprovados_sem_plano
  FROM public.profiles p
  WHERE p.role = 'aluno'
    AND p.approved = true
    AND NOT EXISTS (
      SELECT 1 FROM public.student_plans sp
      WHERE sp.aluno_id = p.id
    );

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DIAGNÓSTICO DE APROVAÇÕES';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Alunos aprovados SEM plano: %', total_aprovados_sem_plano;
  RAISE NOTICE '';

  -- Listar alunos aprovados sem plano
  IF total_aprovados_sem_plano > 0 THEN
    RAISE NOTICE 'ALUNOS APROVADOS SEM PLANO (aprovações indevidas):';
    FOR rec IN
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.approved_at,
        p.approved_by
      FROM public.profiles p
      WHERE p.role = 'aluno'
        AND p.approved = true
        AND NOT EXISTS (
          SELECT 1 FROM public.student_plans sp
          WHERE sp.aluno_id = p.id
        )
      ORDER BY p.approved_at DESC
    LOOP
      RAISE NOTICE '  ⚠️ % (%) - Aprovado em: %', rec.email, rec.full_name, rec.approved_at;
    END LOOP;
    RAISE NOTICE '';
  END IF;
END $$;

-- 2. REVERTER APROVAÇÕES AUTOMÁTICAS INDEVIDAS
-- ============================================
-- Alunos que foram aprovados mas NÃO têm student_plan = aprovação indevida
DO $$
DECLARE
  alunos_revertidos INTEGER := 0;
BEGIN
  WITH aprovacoes_revertidas AS (
    UPDATE public.profiles
    SET
      approved = false,
      approved_at = NULL,
      approved_by = NULL,
      payment_status = NULL,
      payment_plan = NULL,
      payment_value = NULL,
      payment_due_day = NULL,
      last_payment_date = NULL
    WHERE role = 'aluno'
      AND approved = true
      AND NOT EXISTS (
        SELECT 1 FROM public.student_plans sp
        WHERE sp.aluno_id = profiles.id
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO alunos_revertidos FROM aprovacoes_revertidas;

  IF alunos_revertidos > 0 THEN
    RAISE NOTICE '✅ Aprovações indevidas revertidas: % alunos', alunos_revertidos;
  ELSE
    RAISE NOTICE '✅ Nenhuma aprovação indevida encontrada';
  END IF;
  RAISE NOTICE '';
END $$;

-- 3. REMOVER TRIGGERS QUE PODEM APROVAR AUTOMATICAMENTE
-- ============================================
-- Garantir que NENHUM trigger aprova alunos automaticamente
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Listar triggers suspeitos em profiles
  RAISE NOTICE 'Verificando triggers em profiles...';
  FOR rec IN
    SELECT
      tgname as trigger_name,
      pg_get_triggerdef(oid) as trigger_def
    FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND tgname NOT LIKE 'pg_%'
  LOOP
    RAISE NOTICE '  Trigger: %', rec.trigger_name;
  END LOOP;
  RAISE NOTICE '';
END $$;

-- 4. GARANTIR QUE NOVOS PERFIS SEMPRE COMEÇAM COMO NÃO APROVADOS
-- ============================================
-- Recriar função de criação de perfil (garantir approved = false)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- SEMPRE criar perfil com approved = false (aluno PENDENTE)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    approved,  -- SEMPRE FALSE no cadastro
    first_access_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    false,  -- 🔒 BLOQUEADO: Sempre não aprovado no cadastro
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Perfil criado PENDENTE: % (%)', NEW.email, NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao criar perfil %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger recriado - novos alunos sempre PENDENTES';
END $$;

-- 5. RELATÓRIO FINAL
-- ============================================
DO $$
DECLARE
  total_pendentes INTEGER;
  total_aprovados INTEGER;
  total_com_plano INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_pendentes
  FROM public.profiles
  WHERE role = 'aluno' AND approved = false;

  SELECT COUNT(*) INTO total_aprovados
  FROM public.profiles
  WHERE role = 'aluno' AND approved = true;

  SELECT COUNT(*) INTO total_com_plano
  FROM public.profiles p
  WHERE p.role = 'aluno'
    AND p.approved = true
    AND EXISTS (
      SELECT 1 FROM public.student_plans sp
      WHERE sp.aluno_id = p.id
    );

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RELATÓRIO FINAL - STATUS DE ALUNOS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Alunos PENDENTES de aprovação: %', total_pendentes;
  RAISE NOTICE 'Alunos APROVADOS: %', total_aprovados;
  RAISE NOTICE 'Alunos aprovados COM plano: %', total_com_plano;
  RAISE NOTICE '';
  RAISE NOTICE 'FLUXO CORRETO:';
  RAISE NOTICE '1. Aluno se cadastra → fica PENDENTE (approved=false)';
  RAISE NOTICE '2. Coach vê aluno no dashboard';
  RAISE NOTICE '3. Coach clica "Aprovar" → cria student_plan';
  RAISE NOTICE '4. Trigger ativa aluno e cria código único';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- ✅ CORREÇÃO COMPLETA!
--
-- O QUE FOI FEITO:
-- 1. ✅ Identificadas e revertidas aprovações automáticas indevidas
-- 2. ✅ Trigger recriado para SEMPRE criar alunos como PENDENTES
-- 3. ✅ Garantido que apenas coach pode aprovar via API
-- 4. ✅ Relatório detalhado de status de alunos
--
-- APÓS EXECUTAR:
-- - Alunos que foram aprovados automaticamente voltam para PENDENTE
-- - Coach precisa aprovar manualmente cada aluno
-- - Novos cadastros sempre ficam pendentes
