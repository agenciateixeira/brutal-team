-- Criar tabela de tracking de refeições
CREATE TABLE IF NOT EXISTS public.meal_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cafe_da_manha BOOLEAN DEFAULT false,
  lanche_manha BOOLEAN DEFAULT false,
  almoco BOOLEAN DEFAULT false,
  lanche_tarde BOOLEAN DEFAULT false,
  janta BOOLEAN DEFAULT false,
  ceia BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(aluno_id, date)
);

-- Criar tabela de tracking de treinos
CREATE TABLE IF NOT EXISTS public.workout_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('manha', 'tarde', 'noite')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(aluno_id, date, period)
);

-- Habilitar RLS
ALTER TABLE public.meal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_tracking ENABLE ROW LEVEL SECURITY;

-- Policies para meal_tracking
CREATE POLICY "Alunos podem ver seus próprios registros de refeições"
  ON public.meal_tracking
  FOR SELECT
  USING (
    aluno_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Alunos podem inserir seus próprios registros de refeições"
  ON public.meal_tracking
  FOR INSERT
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos podem atualizar seus próprios registros de refeições"
  ON public.meal_tracking
  FOR UPDATE
  USING (aluno_id = auth.uid());

-- Policies para workout_tracking
CREATE POLICY "Alunos podem ver seus próprios registros de treino"
  ON public.workout_tracking
  FOR SELECT
  USING (
    aluno_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

CREATE POLICY "Alunos podem inserir seus próprios registros de treino"
  ON public.workout_tracking
  FOR INSERT
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos podem atualizar seus próprios registros de treino"
  ON public.workout_tracking
  FOR UPDATE
  USING (aluno_id = auth.uid());

-- Triggers para atualizar updated_at
CREATE TRIGGER update_meal_tracking_updated_at
  BEFORE UPDATE ON public.meal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_tracking_updated_at
  BEFORE UPDATE ON public.workout_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_meal_tracking_aluno_id ON public.meal_tracking(aluno_id);
CREATE INDEX IF NOT EXISTS idx_meal_tracking_date ON public.meal_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_tracking_aluno_id ON public.workout_tracking(aluno_id);
CREATE INDEX IF NOT EXISTS idx_workout_tracking_date ON public.workout_tracking(date DESC);
