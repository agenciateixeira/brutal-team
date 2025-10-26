-- ============================================
-- CORRIGIR TABELA NOTIFICATIONS
-- Adiciona coluna 'link' faltante
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

-- ✅ Tabela notifications atualizada!
-- Agora as notificações podem ser criadas com links
