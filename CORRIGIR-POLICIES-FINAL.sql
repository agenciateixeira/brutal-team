-- ============================================
-- 🔧 POLÍTICAS FINAIS - SIMPLES E CLARAS
-- ============================================
-- COMUNIDADE: Apenas alunos convidados (mesma rede)
-- COACHES: NÃO têm acesso
-- CHECK-IN: Primeiro post do dia (trigger já faz isso)

-- ============================================
-- 1. LIMPAR TUDO
-- ============================================

-- Remover TODAS as policies de posts
DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;

-- Remover TODAS as policies de likes
DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem remover curtidas" ON community_likes;
DROP POLICY IF EXISTS "Coaches podem ver todas as curtidas" ON community_likes;

-- Remover TODAS as policies de comments
DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem deletar comentários" ON community_comments;
DROP POLICY IF EXISTS "Coaches podem ver todos os comentários" ON community_comments;

-- Remover TODAS as policies de check-ins
DROP POLICY IF EXISTS "Alunos podem ver check-ins da rede" ON community_check_ins;
DROP POLICY IF EXISTS "Alunos podem criar check-ins" ON community_check_ins;
DROP POLICY IF EXISTS "Coaches podem ver todos check-ins" ON community_check_ins;

-- ============================================
-- 2. POSTS - SIMPLES
-- ============================================

-- Ver: Apenas posts da sua rede (inclui você)
DROP POLICY IF EXISTS "Alunos veem posts da rede" ON community_posts;
CREATE POLICY "Alunos veem posts da rede"
ON community_posts FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Criar: Qualquer aluno pode criar
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
);

-- Deletar: Apenas próprios posts
DROP POLICY IF EXISTS "Alunos deletam próprios posts" ON community_posts;
CREATE POLICY "Alunos deletam próprios posts"
ON community_posts FOR DELETE
USING (
  auth.uid() = aluno_id
);

-- ============================================
-- 3. LIKES - SIMPLES
-- ============================================

-- Ver: Curtidas de posts da rede
DROP POLICY IF EXISTS "Alunos veem curtidas da rede" ON community_likes;
CREATE POLICY "Alunos veem curtidas da rede"
ON community_likes FOR SELECT
USING (
  post_id IN (
    SELECT id FROM community_posts
    WHERE aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Criar: Pode curtir posts da rede
DROP POLICY IF EXISTS "Alunos curtem posts da rede" ON community_likes;
CREATE POLICY "Alunos curtem posts da rede"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT id FROM community_posts
    WHERE aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Deletar: Apenas próprias curtidas
DROP POLICY IF EXISTS "Alunos removem próprias curtidas" ON community_likes;
CREATE POLICY "Alunos removem próprias curtidas"
ON community_likes FOR DELETE
USING (
  auth.uid() = aluno_id
);

-- ============================================
-- 4. COMMENTS - SIMPLES
-- ============================================

-- Ver: Comentários de posts da rede
DROP POLICY IF EXISTS "Alunos veem comentários da rede" ON community_comments;
CREATE POLICY "Alunos veem comentários da rede"
ON community_comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM community_posts
    WHERE aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Criar: Pode comentar em posts da rede
DROP POLICY IF EXISTS "Alunos comentam posts da rede" ON community_comments;
CREATE POLICY "Alunos comentam posts da rede"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT id FROM community_posts
    WHERE aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Deletar: Apenas próprios comentários
DROP POLICY IF EXISTS "Alunos deletam próprios comentários" ON community_comments;
CREATE POLICY "Alunos deletam próprios comentários"
ON community_comments FOR DELETE
USING (
  auth.uid() = aluno_id
);

-- ============================================
-- 5. CHECK-INS - SIMPLES
-- ============================================

-- Ver: Check-ins da rede
DROP POLICY IF EXISTS "Alunos veem check-ins da rede" ON community_check_ins;
CREATE POLICY "Alunos veem check-ins da rede"
ON community_check_ins FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Criar: Qualquer aluno pode criar (trigger controla 1 por dia)
DROP POLICY IF EXISTS "Alunos criam check-ins" ON community_check_ins;
CREATE POLICY "Alunos criam check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
);

-- ============================================
-- ✅ PRONTO!
-- ============================================
-- Regras SIMPLES e CLARAS:
--
-- ✅ Alunos da MESMA REDE veem posts/likes/comentários uns dos outros
-- ✅ Todos podem POSTAR (foto ou texto)
-- ✅ Todos podem CURTIR posts da rede
-- ✅ Todos podem COMENTAR em posts da rede
-- ✅ Cada um DELETA apenas o próprio conteúdo
-- ✅ Check-in: 1 por dia (trigger já controla)
-- ❌ COACHES NÃO veem NADA
-- 🔒 COMUNIDADE EXCLUSIVA por convite
