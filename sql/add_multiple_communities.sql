-- ============================================
-- MIGRAÇÃO: Sistema de Múltiplas Comunidades
-- ============================================
-- Permite comunidades públicas (todos da consultoria) e privadas (grupos privados)
-- Comunidade pública: coach pode ver
-- Comunidades privadas: apenas membros

-- ============================================
-- TABELA: communities
-- ============================================
-- Gerencia diferentes comunidades (pública e privadas)

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_communities_type ON communities(type);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);

-- Criar comunidade pública padrão (se não existir)
INSERT INTO communities (id, name, description, type, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Brutal Team - Comunidade Geral',
  'Comunidade pública de todos os alunos da consultoria',
  'public',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABELA: community_members
-- ============================================
-- Define quem são os membros de cada comunidade

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(community_id, aluno_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_aluno_id ON community_members(aluno_id);

-- ============================================
-- Adicionar community_id em community_posts
-- ============================================

-- Adicionar coluna (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE community_posts
    ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Definir comunidade pública como padrão para posts existentes
UPDATE community_posts
SET community_id = '00000000-0000-0000-0000-000000000001'
WHERE community_id IS NULL;

-- Tornar community_id obrigatório
ALTER TABLE community_posts
ALTER COLUMN community_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Índice
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);

-- ============================================
-- FUNÇÃO: Adicionar todos os alunos à comunidade pública
-- ============================================

CREATE OR REPLACE FUNCTION add_all_students_to_public_community()
RETURNS VOID AS $$
BEGIN
  INSERT INTO community_members (community_id, aluno_id, role)
  SELECT
    '00000000-0000-0000-0000-000000000001',
    id,
    'member'
  FROM profiles
  WHERE role = 'aluno'
  ON CONFLICT (community_id, aluno_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Executar função para adicionar alunos existentes
SELECT add_all_students_to_public_community();

-- ============================================
-- TRIGGER: Auto-adicionar novos alunos à comunidade pública
-- ============================================

CREATE OR REPLACE FUNCTION auto_add_to_public_community()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'aluno' THEN
    INSERT INTO community_members (community_id, aluno_id, role)
    VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'member')
    ON CONFLICT (community_id, aluno_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_add_to_public_community
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_add_to_public_community();

-- ============================================
-- FUNÇÃO: Verificar se usuário é membro da comunidade
-- ============================================

CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
    AND aluno_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGER: Updated_at automático para communities
-- ============================================

CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW
EXECUTE FUNCTION update_communities_updated_at();

-- ============================================
-- REMOVER POLICIES ANTIGAS DE community_posts
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver posts da sua rede" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem criar posts" ON community_posts;
DROP POLICY IF EXISTS "Alunos podem deletar seus posts" ON community_posts;
DROP POLICY IF EXISTS "Coaches podem ver todos os posts" ON community_posts;

-- ============================================
-- NOVAS POLICIES: community_posts
-- ============================================

-- Alunos podem ver posts de comunidades que são membros
CREATE POLICY "Alunos podem ver posts das suas comunidades"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_posts.community_id
    AND cm.aluno_id = auth.uid()
  )
);

-- Alunos podem criar posts em comunidades que são membros
CREATE POLICY "Alunos podem criar posts nas suas comunidades"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_posts.community_id
    AND cm.aluno_id = auth.uid()
  )
);

-- Alunos podem deletar seus próprios posts
CREATE POLICY "Alunos podem deletar seus próprios posts"
ON community_posts FOR DELETE
USING (auth.uid() = aluno_id);

-- Alunos podem atualizar seus próprios posts
CREATE POLICY "Alunos podem atualizar seus próprios posts"
ON community_posts FOR UPDATE
USING (auth.uid() = aluno_id);

-- Coaches podem ver APENAS posts da comunidade pública
CREATE POLICY "Coaches podem ver posts da comunidade pública"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
  AND community_id = '00000000-0000-0000-0000-000000000001'
);

-- ============================================
-- RLS POLICIES: communities
-- ============================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Alunos podem ver comunidades que são membros
CREATE POLICY "Alunos podem ver suas comunidades"
ON communities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = communities.id
    AND cm.aluno_id = auth.uid()
  )
);

-- Alunos podem criar comunidades privadas
CREATE POLICY "Alunos podem criar comunidades privadas"
ON communities FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND type = 'private'
);

-- Alunos podem atualizar comunidades que criaram
CREATE POLICY "Alunos podem atualizar suas comunidades"
ON communities FOR UPDATE
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = communities.id
    AND cm.aluno_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Alunos podem deletar comunidades que criaram
CREATE POLICY "Alunos podem deletar suas comunidades"
ON communities FOR DELETE
USING (auth.uid() = created_by);

-- Coaches podem ver apenas a comunidade pública
CREATE POLICY "Coaches podem ver comunidade pública"
ON communities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
  AND type = 'public'
);

-- ============================================
-- RLS POLICIES: community_members
-- ============================================

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Alunos podem ver membros das comunidades que participam
CREATE POLICY "Alunos podem ver membros das suas comunidades"
ON community_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.aluno_id = auth.uid()
  )
);

-- Alunos podem adicionar membros em comunidades que são admins
CREATE POLICY "Admins podem adicionar membros"
ON community_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.aluno_id = auth.uid()
    AND cm.role = 'admin'
  )
  OR (
    -- Ou se está adicionando a si mesmo (auto-join comunidade pública)
    community_members.aluno_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_members.community_id
      AND c.type = 'public'
    )
  )
);

-- Admins podem remover membros
CREATE POLICY "Admins podem remover membros"
ON community_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.aluno_id = auth.uid()
    AND cm.role = 'admin'
  )
  OR community_members.aluno_id = auth.uid() -- Pode sair da comunidade
);

-- Coaches podem ver membros apenas da comunidade pública
CREATE POLICY "Coaches podem ver membros da comunidade pública"
ON community_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'coach'
  )
  AND community_id = '00000000-0000-0000-0000-000000000001'
);

-- ============================================
-- ATUALIZAR POLICIES: community_likes
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver curtidas da rede" ON community_likes;
DROP POLICY IF EXISTS "Alunos podem curtir posts da rede" ON community_likes;

-- Alunos podem ver curtidas de posts das comunidades que participam
CREATE POLICY "Alunos podem ver curtidas das suas comunidades"
ON community_likes FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    INNER JOIN community_members cm ON cp.community_id = cm.community_id
    WHERE cm.aluno_id = auth.uid()
  )
);

-- Alunos podem curtir posts de comunidades que participam
CREATE POLICY "Alunos podem curtir posts das suas comunidades"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    INNER JOIN community_members cm ON cp.community_id = cm.community_id
    WHERE cm.aluno_id = auth.uid()
  )
);

-- ============================================
-- ATUALIZAR POLICIES: community_comments
-- ============================================

DROP POLICY IF EXISTS "Alunos podem ver comentários da rede" ON community_comments;
DROP POLICY IF EXISTS "Alunos podem comentar posts da rede" ON community_comments;

-- Alunos podem ver comentários de posts das comunidades que participam
CREATE POLICY "Alunos podem ver comentários das suas comunidades"
ON community_comments FOR SELECT
USING (
  post_id IN (
    SELECT cp.id FROM community_posts cp
    INNER JOIN community_members cm ON cp.community_id = cm.community_id
    WHERE cm.aluno_id = auth.uid()
  )
);

-- Alunos podem comentar em posts de comunidades que participam
CREATE POLICY "Alunos podem comentar nas suas comunidades"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = aluno_id
  AND post_id IN (
    SELECT cp.id FROM community_posts cp
    INNER JOIN community_members cm ON cp.community_id = cm.community_id
    WHERE cm.aluno_id = auth.uid()
  )
);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE communities IS 'Gerencia diferentes comunidades (pública e privadas)';
COMMENT ON TABLE community_members IS 'Define membros de cada comunidade';
COMMENT ON COLUMN communities.type IS 'Tipo: public (todos alunos) ou private (grupo privado)';
COMMENT ON FUNCTION is_community_member IS 'Verifica se usuário é membro da comunidade';

-- ============================================
-- 🎉 FINALIZADO!
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Agora você tem:
-- - Comunidade pública (todos os alunos)
-- - Comunidades privadas (grupos privados)
-- - Coach só vê a comunidade pública
