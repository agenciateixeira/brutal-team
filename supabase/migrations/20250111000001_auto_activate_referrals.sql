-- ============================================
-- ATIVAÇÃO AUTOMÁTICA DE INDICAÇÕES
-- ============================================
-- Quando o coach aprovar um aluno, ativa automaticamente
-- a indicação de quem indicou ele

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
