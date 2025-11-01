-- ============================================
-- FIX: Adicionar colunas viewed_by_aluno
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Adicionar coluna viewed_by_aluno na tabela dietas
ALTER TABLE dietas
ADD COLUMN IF NOT EXISTS viewed_by_aluno BOOLEAN DEFAULT FALSE;

-- Adicionar coluna viewed_by_aluno na tabela treinos
ALTER TABLE treinos
ADD COLUMN IF NOT EXISTS viewed_by_aluno BOOLEAN DEFAULT FALSE;

-- Adicionar coluna viewed_by_aluno na tabela protocolos_hormonais
ALTER TABLE protocolos_hormonais
ADD COLUMN IF NOT EXISTS viewed_by_aluno BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN dietas.viewed_by_aluno IS 'Indica se o aluno visualizou a dieta após atualização/ativação';
COMMENT ON COLUMN treinos.viewed_by_aluno IS 'Indica se o aluno visualizou o treino após atualização/ativação';
COMMENT ON COLUMN protocolos_hormonais.viewed_by_aluno IS 'Indica se o aluno visualizou o protocolo após atualização/ativação';

-- ✅ Colunas criadas com sucesso!
-- Agora quando o coach ativar ou criar uma dieta/treino/protocolo,
-- o campo viewed_by_aluno deve ser setado para FALSE
-- e quando o aluno acessar a página, será setado para TRUE
