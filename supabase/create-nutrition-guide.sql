-- =====================================================
-- GUIA NUTRICIONAL - TABELAS DE ALIMENTOS
-- Sistema de equivalências alimentares para alunos
-- =====================================================

-- =====================================================
-- 1. TABELA DE OPÇÕES DE CARBOIDRATOS
-- =====================================================
CREATE TABLE IF NOT EXISTS carb_food_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carb_amount_g INTEGER NOT NULL, -- 20, 40, 60, 80, 100
  food_name TEXT NOT NULL,
  portion_g DECIMAL,
  portion_text TEXT, -- para casos como "3 colheres de sopa"
  type VARCHAR(50) NOT NULL, -- 'melhor', 'secundaria', 'liquida'
  notes TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carb_options_amount ON carb_food_options(carb_amount_g);
CREATE INDEX IF NOT EXISTS idx_carb_options_type ON carb_food_options(type);

-- =====================================================
-- 2. TABELA DE OPÇÕES DE PROTEÍNAS (para futuro)
-- =====================================================
CREATE TABLE IF NOT EXISTS protein_food_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protein_amount_g INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  portion_g DECIMAL,
  portion_text TEXT,
  type VARCHAR(50) NOT NULL,
  notes TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protein_options_amount ON protein_food_options(protein_amount_g);
CREATE INDEX IF NOT EXISTS idx_protein_options_type ON protein_food_options(type);

-- =====================================================
-- 3. INSERIR DADOS DE CARBOIDRATOS - 20g
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, display_order) VALUES
-- Melhores Opções
(20, '65g de arroz parboilizado cozido + 100g de vegetais verdes e/ou crucíferos', 65, 'melhor', 1),
(20, '80g de mandioca cozida', 80, 'melhor', 2),
(20, '130g de batata-doce / cará / inhame / mandioquinha / yacon cozidos', 130, 'melhor', 3),
(20, '200g de batata inglesa cozida (ideal adicionar 5–10g de psyllium)', 200, 'melhor', 4),
(20, '260g de cenoura ou beterraba cozidas', 260, 'melhor', 5),
(20, '450g de abóbora cozida', 450, 'melhor', 6),
-- Secundárias
(20, '80g de leguminosas cozidas (ervilha, lentilha ou grão-de-bico)', 80, 'secundaria', 7),
-- Líquidas / Práticas
(20, '30g de aveia em flocos finos (seca)', 30, 'liquida', 8),
(20, '30g de farinha de arroz, maizena, cuscuz ou sucrilhos (secos)', 30, 'liquida', 9),
(20, '30g de waxy maize (sem sabor preferencialmente)', 30, 'liquida', 10),
(20, '25g de bolacha de arroz integral (seca)', 25, 'liquida', 11),
(20, 'Tapioca (conferir rótulo)', NULL, 'liquida', 12);

-- =====================================================
-- 4. INSERIR DADOS DE CARBOIDRATOS - 40g
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, display_order) VALUES
-- Melhores Opções
(40, '130g de arroz parboilizado cozido + 100g de vegetais verdes e/ou crucíferos', 130, 'melhor', 1),
(40, '260g de batata-doce / cará / inhame / mandioquinha cozidos', 260, 'melhor', 2),
(40, '160g de mandioca cozida', 160, 'melhor', 3),
(40, '65g de arroz parboilizado cozido + 130g de batata-doce / cará / inhame / mandioquinha cozidos', 65, 'melhor', 4),
-- Secundárias
(40, '105g de arroz parboilizado cozido + 60g de lentilha / grão-de-bico / ervilha cozidos', 105, 'secundaria', 5),
(40, '105g de arroz parboilizado cozido + 130g de abóbora cabotiá / cenoura / beterraba cozidas', 105, 'secundaria', 6),
(40, '520g de abóbora cabotiá / cenoura / beterraba cozidas (uso recomendado se intestino estiver preso)', 520, 'secundaria', 7),
-- Líquidas / Práticas
(40, '30g de aveia em flocos finos (seca) + 25g de sucrilhos sem açúcar (secos)', 30, 'liquida', 8),
(40, '50g de farinha de arroz (seca) – ideal para panquecas', 50, 'liquida', 9),
(40, '30g de aveia em flocos finos (seca) + 25g de farinha de arroz / maizena / cuscuz (secos)', 30, 'liquida', 10),
(40, '50g de waxy maize (sem sabor preferencialmente)', 50, 'liquida', 11),
(40, '50g de bolacha de arroz integral ou cuscuz (secos)', 50, 'liquida', 12),
(40, 'Tapioca (ver rótulo)', NULL, 'liquida', 13);

-- =====================================================
-- 5. INSERIR DADOS DE CARBOIDRATOS - 60g
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, display_order) VALUES
-- Melhores Opções
(60, '195g de arroz parboilizado cozido + 100g de vegetais verdes e/ou crucíferos', 195, 'melhor', 1),
(60, '320g de batata-doce / cará / inhame / mandioquinha cozidos', 320, 'melhor', 2),
(60, '240g de mandioca cozida', 240, 'melhor', 3),
(60, '130g de arroz parboilizado cozido + 105g de batata-doce / cará / inhame / mandioquinha cozidos', 130, 'melhor', 4),
(60, '130g de arroz parboilizado cozido + 80g de mandioca cozida', 130, 'melhor', 5),
-- Secundárias
(60, '155g de arroz parboilizado cozido + 80g de lentilha / grão-de-bico / ervilha cozidos', 155, 'secundaria', 6),
(60, '155g de arroz parboilizado cozido + 260g de abóbora cabotiá / cenoura / beterraba cozidas', 155, 'secundaria', 7),
-- Líquidas / Práticas
(60, '40g de aveia em flocos finos (seca) + 30g de sucrilhos sem açúcar (secos)', 40, 'liquida', 8),
(60, '70g de farinha de arroz (seca) – ideal para panquecas', 70, 'liquida', 9),
(60, '40g de aveia em flocos finos (seca) + 30g de farinha de arroz / maizena / cuscuz (secos)', 40, 'liquida', 10),
(60, '70g de waxy maize (sem sabor preferencialmente)', 70, 'liquida', 11),
(60, '70g de bolacha de arroz integral ou cuscuz (secos)', 70, 'liquida', 12),
(60, 'Tapioca (ver rótulo)', NULL, 'liquida', 13);

-- =====================================================
-- 6. INSERIR DADOS DE CARBOIDRATOS - 80g
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, display_order) VALUES
-- Melhores Opções
(80, '260g de arroz parboilizado cozido + 100g de vegetais verdes e/ou crucíferos', 260, 'melhor', 1),
(80, '430g de batata-doce / cará / inhame / mandioquinha cozidos', 430, 'melhor', 2),
(80, '320g de mandioca cozida', 320, 'melhor', 3),
(80, '130g de arroz parboilizado cozido + 215g de batata-doce / cará / inhame / mandioquinha cozidos', 130, 'melhor', 4),
-- Secundárias
(80, '185g de arroz parboilizado cozido + 120g de lentilha / grão-de-bico / ervilha cozidos', 185, 'secundaria', 5),
(80, '210g de arroz parboilizado cozido + 260g de abóbora cabotiá / cenoura / beterraba cozidas', 210, 'secundaria', 6),
-- Líquidas / Práticas
(80, '60g de aveia em flocos finos (seca) + 50g de sucrilhos sem açúcar (secos)', 60, 'liquida', 7),
(80, '100g de farinha de arroz (seca) – ideal para panquecas', 100, 'liquida', 8),
(80, '60g de aveia em flocos finos (seca) + 50g de farinha de arroz / maizena / cuscuz (secos)', 60, 'liquida', 9),
(80, '100g de waxy maize (sem sabor preferencialmente)', 100, 'liquida', 10),
(80, '100g de bolacha de arroz integral ou cuscuz (secos)', 100, 'liquida', 11),
(80, 'Tapioca (ver rótulo)', NULL, 'liquida', 12);

-- =====================================================
-- 7. INSERIR DADOS DE CARBOIDRATOS - 100g
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, display_order) VALUES
-- Melhores Opções
(100, '260g de arroz parboilizado cozido + 100g de vegetais verdes e/ou crucíferos', 260, 'melhor', 1),
(100, '520g de batata-doce / cará / inhame / mandioquinha cozidos', 520, 'melhor', 2),
(100, '320g de mandioca cozida', 320, 'melhor', 3),
(100, '130g de arroz parboilizado cozido + 260g de batata-doce / cará / inhame / mandioquinha cozidos', 130, 'melhor', 4),
-- Secundárias
(100, '180g de arroz parboilizado cozido + 120g de lentilha / grão-de-bico / ervilha cozidos', 180, 'secundaria', 5),
(100, '210g de arroz parboilizado cozido + 260g de abóbora cabotiá / cenoura / beterraba cozidas', 210, 'secundaria', 6),
-- Líquidas / Práticas
(100, '60g de aveia em flocos finos (seca) + 50g de sucrilhos sem açúcar (secos)', 60, 'liquida', 7),
(100, '100g de farinha de arroz (seca) – ideal para panquecas', 100, 'liquida', 8),
(100, '60g de aveia em flocos finos (seca) + 50g de farinha de arroz / maizena / cuscuz (secos)', 60, 'liquida', 9),
(100, '100g de waxy maize (sem sabor preferencialmente)', 100, 'liquida', 10),
(100, '100g de bolacha de arroz integral ou cuscuz (secos)', 100, 'liquida', 11),
(100, 'Tapioca (ver rótulo)', NULL, 'liquida', 12);

-- =====================================================
-- 8. OBSERVAÇÕES E NOTAS
-- =====================================================
INSERT INTO carb_food_options (carb_amount_g, food_name, portion_g, type, notes, display_order) VALUES
(20, 'OBSERVAÇÃO', NULL, 'melhor', 'Todos os alimentos devem ser pesados já cozidos (exceto quando indicado medida caseira)', 99),
(40, 'OBSERVAÇÃO', NULL, 'secundaria', 'Caso sinta gases, estufamento, fezes despedaçadas ou dores abdominais ao consumir leguminosas, evite-as — são ricas em antinutrientes que podem causar desconforto intestinal.', 99),
(60, 'OBSERVAÇÃO', NULL, 'secundaria', 'Caso sinta gases, estufamento, fezes despedaçadas ou dores abdominais ao consumir leguminosas, evite-as, pois são ricas em antinutrientes que podem afetar a digestão.', 99),
(80, 'OBSERVAÇÃO', NULL, 'secundaria', 'Caso sinta gases, estufamento, fezes despedaçadas ou dores abdominais ao consumir leguminosas, evite-as, pois contêm antinutrientes que podem prejudicar a digestão.', 99),
(100, 'OBSERVAÇÃO', NULL, 'secundaria', 'Caso sinta gases, estufamento, fezes despedaçadas ou dores abdominais ao consumir leguminosas, evite-as, pois são ricas em antinutrientes que podem causar desconforto intestinal.', 99);

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================
ALTER TABLE carb_food_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE protein_food_options ENABLE ROW LEVEL SECURITY;

-- Todos podem ver as tabelas de alimentos (são dados públicos do sistema)
DROP POLICY IF EXISTS "Todos podem ver opcoes de carboidratos" ON carb_food_options;
CREATE POLICY "Todos podem ver opcoes de carboidratos"
  ON carb_food_options
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Todos podem ver opcoes de proteinas" ON protein_food_options;
CREATE POLICY "Todos podem ver opcoes de proteinas"
  ON protein_food_options
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas coaches podem editar
DROP POLICY IF EXISTS "Apenas coaches podem editar carboidratos" ON carb_food_options;
CREATE POLICY "Apenas coaches podem editar carboidratos"
  ON carb_food_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Apenas coaches podem editar proteinas" ON protein_food_options;
CREATE POLICY "Apenas coaches podem editar proteinas"
  ON protein_food_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- =====================================================
-- 10. COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE carb_food_options IS 'Opções de alimentos equivalentes para diferentes quantidades de carboidratos';
COMMENT ON TABLE protein_food_options IS 'Opções de alimentos equivalentes para diferentes quantidades de proteínas';
COMMENT ON COLUMN carb_food_options.type IS 'Tipo de opção: melhor, secundaria, liquida';
COMMENT ON COLUMN carb_food_options.portion_g IS 'Quantidade em gramas do alimento (quando aplicável)';
COMMENT ON COLUMN carb_food_options.portion_text IS 'Descrição textual da porção (ex: 3 colheres de sopa)';

-- ✅ Sistema de guia nutricional pronto!
-- Próximo: criar interface para exibir as opções aos alunos
