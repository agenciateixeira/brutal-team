-- ============================================
-- SISTEMA DE TEMPLATES - BRUTAL TEAM
-- Templates reutilizáveis de dietas e treinos
-- ============================================

-- 1. Tabela de templates de dietas
CREATE TABLE IF NOT EXISTS dieta_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  meals_per_day INTEGER NOT NULL DEFAULT 6,
  observacoes_nutricionais TEXT,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de templates de treinos
CREATE TABLE IF NOT EXISTS treino_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  workout_types VARCHAR(50)[] NOT NULL DEFAULT ARRAY['musculacao'],
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS dieta_templates_coach_id_idx ON dieta_templates(coach_id);
CREATE INDEX IF NOT EXISTS dieta_templates_times_used_idx ON dieta_templates(times_used DESC);
CREATE INDEX IF NOT EXISTS treino_templates_coach_id_idx ON treino_templates(coach_id);
CREATE INDEX IF NOT EXISTS treino_templates_times_used_idx ON treino_templates(times_used DESC);

-- 4. RLS para dieta_templates
ALTER TABLE dieta_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches podem gerenciar seus próprios templates de dieta" ON dieta_templates;

CREATE POLICY "Coaches podem gerenciar seus próprios templates de dieta"
  ON dieta_templates FOR ALL
  USING (auth.uid() = coach_id);

-- 5. RLS para treino_templates
ALTER TABLE treino_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches podem gerenciar seus próprios templates de treino" ON treino_templates;

CREATE POLICY "Coaches podem gerenciar seus próprios templates de treino"
  ON treino_templates FOR ALL
  USING (auth.uid() = coach_id);

-- 6. Função para incrementar uso do template de dieta
CREATE OR REPLACE FUNCTION increment_dieta_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o campo template_id foi preenchido ao criar uma dieta
  IF NEW.template_id IS NOT NULL THEN
    UPDATE dieta_templates
    SET times_used = times_used + 1,
        updated_at = NOW()
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para incrementar uso do template de treino
CREATE OR REPLACE FUNCTION increment_treino_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE treino_templates
    SET times_used = times_used + 1,
        updated_at = NOW()
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Adicionar coluna template_id nas tabelas existentes (se não existir)
ALTER TABLE dietas ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES dieta_templates(id) ON DELETE SET NULL;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES treino_templates(id) ON DELETE SET NULL;

-- 9. Criar triggers para incrementar uso
DROP TRIGGER IF EXISTS dieta_template_usage_trigger ON dietas;
DROP TRIGGER IF EXISTS treino_template_usage_trigger ON treinos;

CREATE TRIGGER dieta_template_usage_trigger
  AFTER INSERT ON dietas
  FOR EACH ROW
  EXECUTE FUNCTION increment_dieta_template_usage();

CREATE TRIGGER treino_template_usage_trigger
  AFTER INSERT ON treinos
  FOR EACH ROW
  EXECUTE FUNCTION increment_treino_template_usage();

-- 10. Comentários
COMMENT ON TABLE dieta_templates IS 'Templates reutilizáveis de dietas criados por coaches';
COMMENT ON TABLE treino_templates IS 'Templates reutilizáveis de treinos criados por coaches';
COMMENT ON COLUMN dieta_templates.times_used IS 'Número de vezes que este template foi usado';
COMMENT ON COLUMN treino_templates.times_used IS 'Número de vezes que este template foi usado';

-- ✅ Sistema de Templates pronto!
-- Coach pode criar templates e reutilizar em vários alunos
