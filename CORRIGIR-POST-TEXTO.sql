-- ============================================
-- 🔧 CORRIGIR POSTS DE TEXTO (SEM FOTO)
-- ============================================
-- Problema: Campo photo_url é NOT NULL, mas posts de texto não têm foto
-- Solução: Tornar photo_url NULLABLE para permitir posts só com texto

-- ============================================
-- ALTERAR COLUNA photo_url
-- ============================================

ALTER TABLE community_posts
ALTER COLUMN photo_url DROP NOT NULL;

-- ============================================
-- COMENTÁRIO
-- ============================================

COMMENT ON COLUMN community_posts.photo_url IS 'URL da foto (opcional - posts de texto não têm foto)';

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Agora posts de texto (sem foto) funcionarão corretamente
