-- Script SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar enum para o role do usuário
CREATE TYPE user_role AS ENUM ('coach', 'aluno');

-- Tabela de Perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'aluno',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Fotos de Progresso
CREATE TABLE progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Mensagens
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Dietas
CREATE TABLE dietas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Treinos
CREATE TABLE treinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar índices para melhorar performance
CREATE INDEX idx_progress_photos_aluno_id ON progress_photos(aluno_id);
CREATE INDEX idx_messages_aluno_id ON messages(aluno_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_dietas_aluno_id ON dietas(aluno_id);
CREATE INDEX idx_treinos_aluno_id ON treinos(aluno_id);

-- Habilitar RLS (Row Level Security)
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

-- Trigger para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dietas_updated_at
  BEFORE UPDATE ON dietas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treinos_updated_at
  BEFORE UPDATE ON treinos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar Storage Bucket para fotos de progresso
-- Execute isto no Supabase Dashboard em Storage
-- Bucket name: progress-photos
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- Políticas de Storage (execute após criar o bucket no dashboard)
-- Ir em Storage > progress-photos > Policies e adicionar:

-- Policy: "Alunos podem fazer upload de suas fotos"
-- CREATE POLICY "Alunos podem fazer upload de suas fotos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: "Todos podem ver as fotos"
-- CREATE POLICY "Todos podem ver as fotos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'progress-photos');
