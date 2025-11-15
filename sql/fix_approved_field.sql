-- Garantir que o campo approved existe e tem valor padrão correto
ALTER TABLE public.profiles
ALTER COLUMN approved SET DEFAULT false;

-- Atualizar usuários coaches para approved = true (coaches não precisam de aprovação)
UPDATE public.profiles
SET approved = true
WHERE role = 'coach' AND approved IS NULL;

-- Garantir que alunos sem valor approved sejam marcados como false
UPDATE public.profiles
SET approved = false
WHERE role = 'aluno' AND approved IS NULL;

-- Criar função para auto-aprovar coaches ao criar conta
CREATE OR REPLACE FUNCTION auto_approve_coaches()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'coach' THEN
    NEW.approved := true;
  ELSE
    NEW.approved := COALESCE(NEW.approved, false);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para auto-aprovar coaches
DROP TRIGGER IF EXISTS trigger_auto_approve_coaches ON public.profiles;
CREATE TRIGGER trigger_auto_approve_coaches
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_coaches();

-- Verificar quantos alunos pendentes existem
SELECT COUNT(*) as total_pendentes
FROM public.profiles
WHERE role = 'aluno' AND approved = false;
