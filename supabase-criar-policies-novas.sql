-- CRIAR POLÍTICAS NOVAS (sem recursão)
-- Execute DEPOIS de remover todas as antigas

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

SELECT 'Políticas criadas com sucesso!' as status;
