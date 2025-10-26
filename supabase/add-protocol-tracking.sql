-- ============================================
-- ADICIONAR TRACKING DE PROTOCOLOS
-- Tabela para rastrear cumprimento de protocolos
-- ============================================

-- Criar tabela de tracking de protocolos
CREATE TABLE IF NOT EXISTS public.protocol_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(aluno_id, date)
);

-- Habilitar RLS
ALTER TABLE public.protocol_tracking ENABLE ROW LEVEL SECURITY;

-- Policies para protocol_tracking
CREATE POLICY "Alunos podem ver seus próprios registros de protocolo"
  ON public.protocol_tracking
  FOR SELECT
  USING (
    aluno_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Alunos podem inserir seus próprios registros de protocolo"
  ON public.protocol_tracking
  FOR INSERT
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos podem atualizar seus próprios registros de protocolo"
  ON public.protocol_tracking
  FOR UPDATE
  USING (aluno_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_protocol_tracking_updated_at
  BEFORE UPDATE ON public.protocol_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_protocol_tracking_aluno_id ON public.protocol_tracking(aluno_id);
CREATE INDEX IF NOT EXISTS idx_protocol_tracking_date ON public.protocol_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_protocol_tracking_completed ON public.protocol_tracking(completed);

-- ✅ Tabela protocol_tracking criada!
