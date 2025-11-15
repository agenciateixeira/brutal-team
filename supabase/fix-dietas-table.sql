-- ============================================
-- CORRIGIR TABELA DIETAS
-- Adiciona colunas meals_per_day e observacoes_nutricionais
-- ============================================

-- Verificar e adicionar coluna meals_per_day
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='dietas' AND column_name='meals_per_day') THEN
        ALTER TABLE dietas ADD COLUMN meals_per_day INTEGER DEFAULT 6 NOT NULL;
    END IF;
END $$;

-- Verificar e adicionar coluna observacoes_nutricionais
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='dietas' AND column_name='observacoes_nutricionais') THEN
        ALTER TABLE dietas ADD COLUMN observacoes_nutricionais TEXT;
    END IF;
END $$;

-- ✅ Tabela dietas atualizada!
-- Agora você pode salvar dietas com número de refeições e observações nutricionais
