-- ============================================
-- CORRIGIR TABELA NOTIFICATIONS
-- Adiciona todas as colunas faltantes
-- ============================================

-- Verificar e adicionar coluna link
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='notifications' AND column_name='link') THEN
        ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
        RAISE NOTICE 'Coluna link adicionada à tabela notifications';
    ELSE
        RAISE NOTICE 'Coluna link já existe na tabela notifications';
    END IF;
END $$;

-- Verificar e adicionar coluna related_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='notifications' AND column_name='related_id') THEN
        ALTER TABLE notifications ADD COLUMN related_id UUID;
        RAISE NOTICE 'Coluna related_id adicionada à tabela notifications';
    ELSE
        RAISE NOTICE 'Coluna related_id já existe na tabela notifications';
    END IF;
END $$;

-- Verificar e adicionar coluna icon
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='notifications' AND column_name='icon') THEN
        ALTER TABLE notifications ADD COLUMN icon VARCHAR(50);
        RAISE NOTICE 'Coluna icon adicionada à tabela notifications';
    ELSE
        RAISE NOTICE 'Coluna icon já existe na tabela notifications';
    END IF;
END $$;

-- ✅ Tabela notifications atualizada!
-- Agora as notificações podem ser criadas com link, related_id e icon
