-- Adiciona coluna de macronutrientes à tabela dietas
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE dietas
ADD COLUMN IF NOT EXISTS macronutrientes JSONB DEFAULT NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN dietas.macronutrientes IS 'Tabela de macronutrientes da dieta (calorias, proteinas, carboidratos, gorduras, fibras)';
