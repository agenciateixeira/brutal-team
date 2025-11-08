-- ============================================
-- 🔧 HABILITAR REALTIME NAS TABELAS
-- ============================================
-- Problema: CHANNEL_ERROR - Realtime desabilitado
-- Solução: Habilitar Realtime para community_posts, likes, comments

-- ============================================
-- 1. HABILITAR REALTIME NAS TABELAS
-- ============================================

-- Habilitar para community_posts
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;

-- Habilitar para community_likes
ALTER PUBLICATION supabase_realtime ADD TABLE community_likes;

-- Habilitar para community_comments
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;

-- Habilitar para community_check_ins (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE community_check_ins;

-- ============================================
-- 2. VERIFICAR SE FOI HABILITADO
-- ============================================

SELECT
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'community%'
ORDER BY tablename;

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Realtime agora está habilitado para:
-- ✅ community_posts (novos posts aparecem instantaneamente)
-- ✅ community_likes (curtidas em tempo real)
-- ✅ community_comments (comentários em tempo real)
-- ✅ community_check_ins (check-ins em tempo real)
