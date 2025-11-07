-- ============================================
-- ATIVAÇÃO AUTOMÁTICA DE INDICAÇÕES
-- ============================================
-- 🎯 OBJETIVO: Quando o coach aprovar um aluno, ativar automaticamente
--              a indicação de quem indicou ele
--
-- 📋 COMO USAR:
--    1. Copie todo este código
--    2. Cole no SQL Editor do Supabase Dashboard
--    3. Execute (Run)
--
-- ============================================

-- Modificar a função existente para incluir ativação de indicações
CREATE OR REPLACE FUNCTION create_access_code_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se aluno foi aprovado e não tem código ainda
  IF NEW.approved = TRUE AND OLD.approved = FALSE THEN
    -- 1. Criar código de acesso
    INSERT INTO access_codes (aluno_id, code)
    VALUES (NEW.id, generate_unique_access_code())
    ON CONFLICT (aluno_id) DO NOTHING;

    -- 2. Ativar indicação pendente (se existir)
    UPDATE referrals
    SET
      status = 'active',
      activated_at = NOW()
    WHERE
      referred_id = NEW.id
      AND status = 'pending';

    RAISE NOTICE '✅ Aluno aprovado: % - Código criado e indicação ativada', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS trigger_create_access_code ON profiles;

CREATE TRIGGER trigger_create_access_code
  AFTER UPDATE OF approved ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'aluno')
  EXECUTE FUNCTION create_access_code_on_approval();

-- Comentário
COMMENT ON FUNCTION create_access_code_on_approval() IS 'Trigger que cria código de acesso E ativa indicação quando coach aprova aluno';

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_code TEXT;
BEGIN
  -- Verificar se o trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_create_access_code'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger criado com sucesso!';
  ELSE
    RAISE NOTICE '❌ ERRO: Trigger não foi criado';
  END IF;

  -- Mostrar código da função para confirmar que tem a lógica de referrals
  SELECT pg_get_functiondef(oid) INTO function_code
  FROM pg_proc
  WHERE proname = 'create_access_code_on_approval';

  IF function_code LIKE '%referrals%' THEN
    RAISE NOTICE '✅ Função atualizada com lógica de ativação de indicações';
  ELSE
    RAISE NOTICE '❌ ERRO: Função não tem lógica de referrals';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎉 SISTEMA CONFIGURADO COM SUCESSO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Como funciona agora:';
  RAISE NOTICE '  1. Aluno se cadastra com código de indicação';
  RAISE NOTICE '  2. Indicação fica como "pending"';
  RAISE NOTICE '  3. Coach aprova o aluno';
  RAISE NOTICE '  4. ✨ AUTOMATICAMENTE a indicação vira "active"';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Para testar:';
  RAISE NOTICE '  - Veja se a indicação do seu amigo foi ativada:';
  RAISE NOTICE '    SELECT * FROM referrals ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '';
END $$;
