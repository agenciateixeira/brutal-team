-- CORRIGIR POLÍTICAS RLS (Remover Recursão Infinita)
-- Execute este script no SQL Editor do Supabase

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Coaches podem ver perfis de alunos" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Alunos podem ver suas próprias fotos" ON progress_photos;
DROP POLICY IF EXISTS "Coaches podem ver todas as fotos" ON progress_photos;
DROP POLICY IF EXISTS "Alunos podem inserir suas próprias fotos" ON progress_photos;
DROP POLICY IF EXISTS "Alunos podem ver mensagens relacionadas a eles" ON messages;
DROP POLICY IF EXISTS "Coaches podem ver todas as mensagens" ON messages;
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON messages;
DROP POLICY IF EXISTS "Coaches podem atualizar mensagens (marcar como lidas)" ON messages;
DROP POLICY IF EXISTS "Alunos podem ver suas próprias dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches podem ver todas as dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches podem inserir dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches podem atualizar dietas" ON dietas;
DROP POLICY IF EXISTS "Coaches podem deletar dietas" ON dietas;
DROP POLICY IF EXISTS "Alunos podem ver seus próprios treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches podem ver todos os treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches podem inserir treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches podem atualizar treinos" ON treinos;
DROP POLICY IF EXISTS "Coaches podem deletar treinos" ON treinos;

-- 2. CRIAR POLÍTICAS CORRIGIDAS (SEM RECURSÃO)

-- Políticas para PROFILES
CREATE POLICY "allow_select_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "allow_select_all_profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "allow_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "allow_insert_profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- Políticas para PROGRESS_PHOTOS
CREATE POLICY "allow_select_own_photos" ON progress_photos
  FOR SELECT USING (aluno_id = auth.uid());

CREATE POLICY "allow_select_all_photos" ON progress_photos
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_own_photos" ON progress_photos
  FOR INSERT WITH CHECK (aluno_id = auth.uid());

-- Políticas para MESSAGES
CREATE POLICY "allow_select_related_messages" ON messages
  FOR SELECT USING (aluno_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "allow_select_all_messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "allow_update_messages" ON messages
  FOR UPDATE USING (true);

-- Políticas para DIETAS
CREATE POLICY "allow_select_own_dietas" ON dietas
  FOR SELECT USING (aluno_id = auth.uid());

CREATE POLICY "allow_select_all_dietas" ON dietas
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_dietas" ON dietas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_dietas" ON dietas
  FOR UPDATE USING (true);

CREATE POLICY "allow_delete_dietas" ON dietas
  FOR DELETE USING (true);

-- Políticas para TREINOS
CREATE POLICY "allow_select_own_treinos" ON treinos
  FOR SELECT USING (aluno_id = auth.uid());

CREATE POLICY "allow_select_all_treinos" ON treinos
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_treinos" ON treinos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_treinos" ON treinos
  FOR UPDATE USING (true);

CREATE POLICY "allow_delete_treinos" ON treinos
  FOR DELETE USING (true);

SELECT 'Políticas RLS corrigidas com sucesso!' as status;
