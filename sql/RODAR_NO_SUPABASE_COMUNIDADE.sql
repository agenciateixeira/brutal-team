-- ============================================
-- 🏆 ETAPA 4: COMUNIDADE SOCIAL (GymRats Style)
-- ============================================
-- Sistema de comunidade baseado em rede de indicações
-- Cada aluno que indica amigos cria uma comunidade privada
-- Todos da rede (indicados + indicados dos indicados) fazem parte

-- ============================================
-- TABELA: community_posts
-- ============================================
-- Armazena posts de treino dos membros da comunidade

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  workout_type TEXT, -- 'treino', 'cardio', 'descanso_ativo', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_community_posts_aluno_id ON community_posts(aluno_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- ============================================
-- TABELA: community_likes
-- ============================================
-- Sistema de curtidas nos posts

CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, aluno_id) -- Um aluno só pode curtir uma vez por post
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_aluno_id ON community_likes(aluno_id);

-- ============================================
-- TABELA: community_comments
-- ============================================
-- Sistema de comentários nos posts

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_aluno_id ON community_comments(aluno_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON community_comments(created_at ASC);

-- ============================================
-- TABELA: community_check_ins
-- ============================================
-- Tracking de check-ins diários (postar treino = check-in)

CREATE TABLE IF NOT EXISTS community_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(aluno_id, date) -- Um check-in por dia
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_check_ins_aluno_id ON community_check_ins(aluno_id);
CREATE INDEX IF NOT EXISTS idx_community_check_ins_date ON community_check_ins(date DESC);

-- ============================================
-- FUNÇÃO: Calcular rede de amigos (comunidade)
-- ============================================
-- Retorna todos os IDs da rede de indicações de um aluno
-- Inclui: o próprio aluno + todos que ele indicou + todos que os indicados dele indicaram

CREATE OR REPLACE FUNCTION get_community_network(user_id UUID)
RETURNS TABLE(member_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE referral_tree AS (
    -- Caso base: o próprio usuário
    SELECT id as member_id, referral_code
    FROM profiles
    WHERE id = user_id

    UNION

    -- Recursão: todos que foram indicados por alguém da árvore
    SELECT p.id as member_id, p.referral_code
    FROM profiles p
    INNER JOIN referral_tree rt ON p.referred_by = rt.referral_code
  )
  SELECT DISTINCT member_id FROM referral_tree;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNÇÃO: Contar check-ins do ano
-- ============================================
-- Conta quantos dias o aluno fez check-in no ano atual

CREATE OR REPLACE FUNCTION get_yearly_check_ins(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM community_check_ins
    WHERE aluno_id = user_id
    AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNÇÃO: Calcular streak atual
-- ============================================
-- Calcula quantos dias consecutivos o aluno fez check-in

CREATE OR REPLACE FUNCTION get_current_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak_count INTEGER := 0;
  check_date DATE;
BEGIN
  -- Verificar se tem check-in hoje ou ontem (para não quebrar no início do dia)
  IF NOT EXISTS (
    SELECT 1 FROM community_check_ins
    WHERE aluno_id = user_id
    AND date >= CURRENT_DATE - INTERVAL '1 day'
  ) THEN
    RETURN 0;
  END IF;

  -- Contar dias consecutivos a partir de hoje/ontem
  FOR check_date IN (
    SELECT date
    FROM community_check_ins
    WHERE aluno_id = user_id
    AND date <= CURRENT_DATE
    ORDER BY date DESC
  ) LOOP
    IF current_streak_count = 0 THEN
      current_streak_count := 1;
    ELSIF check_date = CURRENT_DATE - (current_streak_count || ' days')::INTERVAL THEN
      current_streak_count := current_streak_count + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN current_streak_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGER: Auto check-in ao postar treino
-- ============================================
-- Quando um post é criado, marca check-in do dia automaticamente

CREATE OR REPLACE FUNCTION auto_check_in_on_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir check-in (ou ignorar se já existe para hoje)
  INSERT INTO community_check_ins (aluno_id, date, post_id)
  VALUES (NEW.aluno_id, CURRENT_DATE, NEW.id)
  ON CONFLICT (aluno_id, date) DO UPDATE
  SET post_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_check_in
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION auto_check_in_on_post();

-- ============================================
-- TRIGGER: Updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column_community()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_community();

-- ============================================
-- VIEW: Community Stats
-- ============================================
-- Estatísticas gerais da comunidade de cada aluno

CREATE OR REPLACE VIEW community_stats AS
SELECT
  p.id as aluno_id,
  p.full_name,
  COUNT(DISTINCT network.member_id) - 1 as network_size, -- -1 para não contar o próprio
  get_yearly_check_ins(p.id) as yearly_check_ins,
  get_current_streak(p.id) as current_streak,
  (
    SELECT COUNT(*)
    FROM community_posts cp
    WHERE cp.aluno_id = p.id
  ) as total_posts,
  (
    SELECT COUNT(*)
    FROM community_likes cl
    INNER JOIN community_posts cp ON cl.post_id = cp.id
    WHERE cp.aluno_id = p.id
  ) as total_likes_received
FROM profiles p
CROSS JOIN LATERAL get_community_network(p.id) as network
WHERE p.role = 'aluno'
GROUP BY p.id, p.full_name;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_check_ins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: community_posts
-- ============================================

-- Alunos podem ver posts de sua rede de amigos
CREATE POLICY "Alunos podem ver posts da sua rede"
ON community_posts FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Alunos podem criar seus próprios posts
CREATE POLICY "Alunos podem criar posts"
ON community_posts FOR INSERT
WITH CHECK (auth.uid() = aluno_id);

-- Alunos podem deletar seus próprios posts
CREATE POLICY "Alunos podem deletar seus posts"
ON community_posts FOR DELETE
USING (auth.uid() = aluno_id);

-- Coaches podem ver todos os posts
CREATE POLICY "Coaches podem ver todos os posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- ============================================
-- POLICIES: community_likes
-- ============================================

-- Alunos podem ver curtidas de posts da sua rede
CREATE POLICY "Alunos podem ver curtidas da rede"
ON community_likes FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem curtir posts da sua rede
CREATE POLICY "Alunos podem curtir posts da rede"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem remover suas próprias curtidas
CREATE POLICY "Alunos podem remover curtidas"
ON community_likes FOR DELETE
USING (auth.uid() = aluno_id);

-- ============================================
-- POLICIES: community_comments
-- ============================================

-- Alunos podem ver comentários de posts da sua rede
CREATE POLICY "Alunos podem ver comentários da rede"
ON community_comments FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem comentar em posts da sua rede
CREATE POLICY "Alunos podem comentar posts da rede"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    WHERE cp.aluno_id IN (
      SELECT member_id FROM get_community_network(auth.uid())
    )
  )
);

-- Alunos podem deletar seus próprios comentários
CREATE POLICY "Alunos podem deletar comentários"
ON community_comments FOR DELETE
USING (auth.uid() = aluno_id);

-- ============================================
-- POLICIES: community_check_ins
-- ============================================

-- Alunos podem ver check-ins da sua rede
CREATE POLICY "Alunos podem ver check-ins da rede"
ON community_check_ins FOR SELECT
USING (
  aluno_id IN (
    SELECT member_id FROM get_community_network(auth.uid())
  )
);

-- Alunos podem criar seus próprios check-ins
CREATE POLICY "Alunos podem criar check-ins"
ON community_check_ins FOR INSERT
WITH CHECK (auth.uid() = aluno_id);

-- Coaches podem ver todos os check-ins
CREATE POLICY "Coaches podem ver todos check-ins"
ON community_check_ins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE community_posts IS 'Posts de treino dos membros da comunidade (estilo GymRats)';
COMMENT ON TABLE community_likes IS 'Sistema de curtidas nos posts';
COMMENT ON TABLE community_comments IS 'Sistema de comentários nos posts';
COMMENT ON TABLE community_check_ins IS 'Tracking de check-ins diários (postar treino = marcar presença)';
COMMENT ON FUNCTION get_community_network IS 'Retorna todos os membros da rede de indicações de um aluno';
COMMENT ON FUNCTION get_yearly_check_ins IS 'Conta quantos check-ins o aluno fez no ano atual';
COMMENT ON FUNCTION get_current_streak IS 'Calcula streak atual (dias consecutivos de check-in)';

-- ============================================
-- 🎉 FINALIZADO!
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Depois teste criando um post e verificando o check-in automático
