-- ============================================
-- 🔧 ATUALIZAR POLÍTICAS - Versão 3
-- ============================================
-- Problema: CORRIGIR-FUNCAO-REDE-V2.sql já criou as policies básicas
-- Solução: Apenas SUBSTITUIR as que precisam permitir próprios posts

-- ============================================
-- 1. SUBSTITUIR POLÍTICA DE POSTS
-- ============================================

-- Remover e recriar para incluir próprios posts
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;

CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  -- Próprios posts (sempre)
  aluno_id = auth.uid()
  -- OU posts da rede
  OR aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- ============================================
-- 2. SUBSTITUIR POLÍTICA DE LIKES (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;

CREATE POLICY "Alunos podem ver curtidas da rede"
ON community_likes FOR SELECT
USING (
  -- Curtidas dos próprios posts (sempre)
  post_id IN (SELECT id FROM community_posts WHERE aluno_id = auth.uid())
  -- OU curtidas de posts da rede
  OR post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- ============================================
-- 3. SUBSTITUIR POLÍTICA DE LIKES (INSERT)
-- ============================================

DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;

CREATE POLICY "Alunos podem curtir posts da rede"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND (
    -- Pode curtir próprios posts (sempre)
    post_id IN (SELECT id FROM community_posts WHERE aluno_id = auth.uid())
    -- OU posts da rede
    OR post_id IN (
      SELECT cp.id FROM community_posts cp
      WHERE cp.aluno_id IN (
        SELECT member_id FROM get_community_network(auth.uid())
      )
    )
  )
);

-- ============================================
-- 4. SUBSTITUIR POLÍTICA DE COMMENTS (SELECT)
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;

CREATE POLICY "Alunos podem ver comentários da rede"
ON community_comments FOR SELECT
USING (
  -- Comentários dos próprios posts (sempre)
  post_id IN (SELECT id FROM community_posts WHERE aluno_id = auth.uid())
  -- OU comentários de posts da rede
  OR post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- ============================================
-- 5. SUBSTITUIR POLÍTICA DE COMMENTS (INSERT)
-- ============================================

DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;

CREATE POLICY "Alunos podem comentar posts da rede"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND (
    -- Pode comentar próprios posts (sempre)
    post_id IN (SELECT id FROM community_posts WHERE aluno_id = auth.uid())
    -- OU posts da rede
    OR post_id IN (
      SELECT cp.id FROM community_posts cp
      WHERE cp.aluno_id IN (
        SELECT member_id FROM get_community_network(auth.uid())
      )
    )
  )
);

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Execute este SQL no Supabase SQL Editor
--
-- Agora:
-- ✅ SEMPRE pode curtir/comentar/ver os PRÓPRIOS posts
-- ✅ Pode curtir/comentar/ver posts da REDE
-- 🔒 COMUNIDADE EXCLUSIVA: só sua rede vê seus posts
