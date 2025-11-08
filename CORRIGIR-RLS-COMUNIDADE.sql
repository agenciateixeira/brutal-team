-- ============================================
-- 🔧 CORRIGIR POLÍTICAS RLS - COMUNIDADE
-- ============================================
-- Problema: Políticas muito restritivas impedindo interação
-- Solução: Permitir que todos os alunos vejam e interajam

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;

-- ============================================
-- 2. CRIAR POLÍTICAS CORRETAS
-- ============================================

-- POSTS: Todos os alunos podem ver todos os posts
CREATE POLICY "Alunos podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- LIKES: Todos os alunos podem ver todas as curtidas
CREATE POLICY "Alunos podem ver todas as curtidas"
ON community_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- LIKES: Alunos podem curtir qualquer post (simplificado)
CREATE POLICY "Alunos podem curtir qualquer post"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- COMMENTS: Todos os alunos podem ver todos os comentários
CREATE POLICY "Alunos podem ver todos os comentários"
ON community_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- COMMENTS: Alunos podem comentar em qualquer post
CREATE POLICY "Alunos podem comentar em qualquer post"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'aluno'
  )
);

-- ============================================
-- 3. ADICIONAR POLÍTICAS PARA COACHES
-- ============================================

-- LIKES: Coaches podem ver todas as curtidas
CREATE POLICY "Coaches podem ver todas as curtidas"
ON community_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- COMMENTS: Coaches podem ver todos os comentários
CREATE POLICY "Coaches podem ver todos os comentários"
ON community_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Agora todos os alunos poderão:
-- ✅ Ver todos os posts da plataforma
-- ✅ Curtir qualquer post
-- ✅ Comentar em qualquer post
-- ✅ Deletar apenas seus próprios comentários/curtidas
