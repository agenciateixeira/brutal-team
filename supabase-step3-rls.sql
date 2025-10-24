-- PASSO 3: Configurar RLS (Row Level Security)
-- Execute depois do PASSO 2

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietas ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches podem ver perfis de alunos"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas RLS para Progress Photos
CREATE POLICY "Alunos podem ver suas próprias fotos"
  ON progress_photos FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Coaches podem ver todas as fotos"
  ON progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Alunos podem inserir suas próprias fotos"
  ON progress_photos FOR INSERT
  WITH CHECK (aluno_id = auth.uid());

-- Políticas RLS para Messages
CREATE POLICY "Alunos podem ver mensagens relacionadas a eles"
  ON messages FOR SELECT
  USING (aluno_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Coaches podem ver todas as mensagens"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Usuários podem enviar mensagens"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Coaches podem atualizar mensagens (marcar como lidas)"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Políticas RLS para Dietas
CREATE POLICY "Alunos podem ver suas próprias dietas"
  ON dietas FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Coaches podem ver todas as dietas"
  ON dietas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem inserir dietas"
  ON dietas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem atualizar dietas"
  ON dietas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem deletar dietas"
  ON dietas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Políticas RLS para Treinos
CREATE POLICY "Alunos podem ver seus próprios treinos"
  ON treinos FOR SELECT
  USING (aluno_id = auth.uid());

CREATE POLICY "Coaches podem ver todos os treinos"
  ON treinos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem inserir treinos"
  ON treinos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem atualizar treinos"
  ON treinos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Coaches podem deletar treinos"
  ON treinos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );
