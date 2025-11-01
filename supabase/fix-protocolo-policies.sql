-- ============================================
-- FIX: Corrigir policies da tabela protocolos_hormonais
-- Execute este SQL no Supabase
-- ============================================

-- Garantir que RLS está habilitado
ALTER TABLE protocolos_hormonais ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Alunos podem ver seus protocolos" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Alunos podem atualizar seus protocolos" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Coaches podem ver todos protocolos" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Coaches podem criar protocolos" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Coaches podem atualizar protocolos" ON protocolos_hormonais;
DROP POLICY IF EXISTS "Coaches podem deletar protocolos" ON protocolos_hormonais;

-- Policy para alunos VEREM seus protocolos
CREATE POLICY "Alunos podem ver seus protocolos"
  ON protocolos_hormonais FOR SELECT
  USING (auth.uid() = aluno_id);

-- Policy para alunos ATUALIZAREM seus protocolos (viewed_by_aluno)
CREATE POLICY "Alunos podem atualizar seus protocolos"
  ON protocolos_hormonais FOR UPDATE
  USING (auth.uid() = aluno_id)
  WITH CHECK (auth.uid() = aluno_id);

-- Policy para coaches VEREM todos protocolos
CREATE POLICY "Coaches podem ver todos protocolos"
  ON protocolos_hormonais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Policy para coaches CRIAREM protocolos
CREATE POLICY "Coaches podem criar protocolos"
  ON protocolos_hormonais FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Policy para coaches ATUALIZAREM protocolos
CREATE POLICY "Coaches podem atualizar protocolos"
  ON protocolos_hormonais FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Policy para coaches DELETAREM protocolos
CREATE POLICY "Coaches podem deletar protocolos"
  ON protocolos_hormonais FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- ✅ Policies corrigidas!
-- Agora os alunos devem conseguir atualizar viewed_by_aluno
