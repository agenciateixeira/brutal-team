-- Criar tabela de protocolos hormonais
CREATE TABLE IF NOT EXISTS public.protocolos_hormonais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.protocolos_hormonais ENABLE ROW LEVEL SECURITY;

-- Policy: Alunos podem ver seus próprios protocolos
CREATE POLICY "Alunos podem ver seus próprios protocolos"
  ON public.protocolos_hormonais
  FOR SELECT
  USING (
    aluno_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Policy: Coaches podem criar protocolos para alunos
CREATE POLICY "Coaches podem criar protocolos"
  ON public.protocolos_hormonais
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Policy: Coaches podem atualizar protocolos
CREATE POLICY "Coaches podem atualizar protocolos"
  ON public.protocolos_hormonais
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Policy: Coaches podem deletar protocolos
CREATE POLICY "Coaches podem deletar protocolos"
  ON public.protocolos_hormonais
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_protocolos_hormonais_updated_at
  BEFORE UPDATE ON public.protocolos_hormonais
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_protocolos_hormonais_aluno_id ON public.protocolos_hormonais(aluno_id);
CREATE INDEX IF NOT EXISTS idx_protocolos_hormonais_active ON public.protocolos_hormonais(active);
CREATE INDEX IF NOT EXISTS idx_protocolos_hormonais_created_at ON public.protocolos_hormonais(created_at DESC);
