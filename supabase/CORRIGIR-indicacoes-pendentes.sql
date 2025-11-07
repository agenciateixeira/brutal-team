-- ============================================
-- CORRIGIR INDICAÇÕES PENDENTES
-- ============================================
-- 🎯 OBJETIVO: Ativar indicações que deveriam estar ativas
--              (alunos que já foram aprovados mas indicação ficou pendente)
--
-- 📋 COMO USAR:
--    1. Execute PRIMEIRO o arquivo "EXECUTAR-ativacao-automatica-indicacoes.sql"
--    2. Depois execute este arquivo para corrigir casos antigos
--
-- ============================================

DO $$
DECLARE
  ref_record RECORD;
  total_corrigidas INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Buscando indicações pendentes de alunos já aprovados...';
  RAISE NOTICE '';

  -- Buscar e corrigir todas as indicações pendentes de alunos aprovados
  FOR ref_record IN
    SELECT
      r.id,
      r.referral_code,
      r.referred_email,
      p.email as aluno_email,
      p.full_name as aluno_nome,
      p.approved,
      p.approved_at
    FROM referrals r
    INNER JOIN profiles p ON p.id = r.referred_id
    WHERE r.status = 'pending'
      AND p.approved = true
    ORDER BY p.approved_at DESC
  LOOP
    -- Ativar a indicação
    UPDATE referrals
    SET
      status = 'active',
      activated_at = COALESCE(ref_record.approved_at, NOW())
    WHERE id = ref_record.id;

    total_corrigidas := total_corrigidas + 1;

    RAISE NOTICE '✅ Indicação ativada:';
    RAISE NOTICE '   Aluno: % (%)', ref_record.aluno_nome, ref_record.aluno_email;
    RAISE NOTICE '   Código usado: %', ref_record.referral_code;
    RAISE NOTICE '   Aprovado em: %', ref_record.approved_at;
    RAISE NOTICE '';
  END LOOP;

  IF total_corrigidas = 0 THEN
    RAISE NOTICE '✨ Nenhuma correção necessária!';
    RAISE NOTICE '   Todas as indicações estão corretas.';
  ELSE
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 CORREÇÃO CONCLUÍDA!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total de indicações corrigidas: %', total_corrigidas;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📊 Status final das indicações:';
END $$;

-- Mostrar resumo
SELECT
  status,
  COUNT(*) as total
FROM referrals
GROUP BY status
ORDER BY status;

-- Mostrar últimas indicações
SELECT
  r.id,
  p.full_name as referrer_nome,
  r.referred_email,
  r.status,
  r.created_at,
  r.activated_at
FROM referrals r
LEFT JOIN profiles p ON p.id = r.referrer_id
ORDER BY r.created_at DESC
LIMIT 10;
