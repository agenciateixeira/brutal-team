-- ============================================
-- HABILITAR REALTIME PARA TODAS AS TABELAS
-- ============================================

-- 1. Habilitar Realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Habilitar Realtime para meal_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE meal_tracking;

-- 3. Habilitar Realtime para workout_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE workout_tracking;

-- 4. Habilitar Realtime para protocol_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE protocol_tracking;

-- 5. Configurar REPLICA IDENTITY para todas as tabelas
-- Isso permite que o Supabase Realtime envie os dados completos
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE meal_tracking REPLICA IDENTITY FULL;
ALTER TABLE workout_tracking REPLICA IDENTITY FULL;
ALTER TABLE protocol_tracking REPLICA IDENTITY FULL;

-- ✅ Realtime habilitado!
-- Agora as mudanças nas tabelas serão transmitidas via WebSocket
