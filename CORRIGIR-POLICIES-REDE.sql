-- ============================================
-- 🔧 CORRIGIR POLÍTICAS RLS - COMUNIDADE
-- ============================================
-- Problema: Políticas não permitem curtir próprios posts
-- Solução: SEMPRE pode curtir/comentar próprios posts + posts da rede
-- IMPORTANTE: Comunidade é EXCLUSIVA - só quem tem convite vê

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS (ALUNOS)
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;

-- ============================================
-- 2. NÃO PRECISA DE FUNÇÃO AUXILIAR
-- ============================================
-- Removida: A lógica agora é simples - só próprios posts + rede

-- ============================================
-- 3. NOVAS POLÍTICAS: POSTS
-- ============================================

-- Alunos podem ver próprios posts + posts da rede (EXCLUSIVO)
CREATE POLICY "Alunos podem ver posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
  AND (
    -- Próprios posts (sempre)
    aluno_id = auth.uid()
    -- OU posts da rede (se tiver rede)
    OR aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- ============================================
-- 4. NOVAS POLÍTICAS: LIKES
-- ============================================

-- Alunos podem ver curtidas
CREATE POLICY "Alunos podem ver curtidas"
ON community_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- Alunos podem curtir próprios posts + posts da rede (EXCLUSIVO)
CREATE POLICY "Alunos podem curtir posts"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
  AND (
    -- Pode curtir próprios posts (sempre)
    post_id IN (
      SELECT id FROM community_posts WHERE aluno_id = auth.uid()
    )
    -- OU posts da rede (se tiver rede)
    OR post_id IN (
      SELECT cp.id FROM community_posts cp
      WHERE cp.aluno_id IN (
        SELECT member_id FROM get_community_network(auth.uid())
      )
    )
  )
);

-- ============================================
-- 5. NOVAS POLÍTICAS: COMMENTS
-- ============================================

-- Alunos podem ver comentários
CREATE POLICY "Alunos podem ver comentários"
ON community_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- Alunos podem comentar em próprios posts + posts da rede (EXCLUSIVO)
CREATE POLICY "Alunos podem comentar em posts"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
  AND (
    -- Pode comentar nos próprios posts (sempre)
    post_id IN (
      SELECT id FROM community_posts WHERE aluno_id = auth.uid()
    )
    -- OU posts da rede (se tiver rede)
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
-- ✅ SEMPRE pode curtir/comentar nos PRÓPRIOS posts
-- ✅ TEM rede → vê e interage com TODA a sua rede
-- ✅ NÃO TEM rede → fica ISOLADO (só vê próprios posts)
-- 🔒 COMUNIDADE EXCLUSIVA: só entra com link de convite!
