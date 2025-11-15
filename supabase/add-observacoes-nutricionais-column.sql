-- Adiciona coluna de observações nutricionais à tabela dietas
-- Execute este SQL no Supabase SQL Editor

-- Remove coluna antiga se existir
ALTER TABLE dietas DROP COLUMN IF EXISTS macronutrientes;

-- Adiciona nova coluna
ALTER TABLE dietas
ADD COLUMN IF NOT EXISTS observacoes_nutricionais TEXT DEFAULT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN dietas.observacoes_nutricionais IS 'Observações nutricionais gerais da dieta (texto livre)';
