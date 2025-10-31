-- ============================================
-- Salvar Fotos de Primeiro Acesso no Histórico de Progresso
-- ============================================

-- 1. Adicionar campos necessários na tabela progress_photos
ALTER TABLE progress_photos
ADD COLUMN IF NOT EXISTS is_first_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS position VARCHAR(10), -- 'front', 'side', 'back'
ADD COLUMN IF NOT EXISTS group_id UUID; -- agrupar fotos da mesma semana/evento

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_group ON progress_photos(group_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_first_access ON progress_photos(is_first_access);

-- 2. Função para salvar fotos de primeiro acesso no histórico
CREATE OR REPLACE FUNCTION save_first_access_to_progress()
RETURNS TRIGGER AS $$
DECLARE
  group_uuid UUID;
BEGIN
  -- Gerar UUID único para agrupar as 3 fotos
  group_uuid := gen_random_uuid();

  -- Inserir foto frontal
  INSERT INTO progress_photos (
    aluno_id,
    photo_url,
    week_number,
    notes,
    is_first_access,
    position,
    group_id,
    created_at
  ) VALUES (
    NEW.aluno_id,
    NEW.front_photo_url,
    0, -- Semana 0 = primeiro acesso
    'Foto frontal - Primeiro Acesso',
    TRUE,
    'front',
    group_uuid,
    NEW.uploaded_at
  );

  -- Inserir foto lateral
  INSERT INTO progress_photos (
    aluno_id,
    photo_url,
    week_number,
    notes,
    is_first_access,
    position,
    group_id,
    created_at
  ) VALUES (
    NEW.aluno_id,
    NEW.side_photo_url,
    0,
    'Foto lateral - Primeiro Acesso',
    TRUE,
    'side',
    group_uuid,
    NEW.uploaded_at
  );

  -- Inserir foto de costas
  INSERT INTO progress_photos (
    aluno_id,
    photo_url,
    week_number,
    notes,
    is_first_access,
    position,
    group_id,
    created_at
  ) VALUES (
    NEW.aluno_id,
    NEW.back_photo_url,
    0,
    'Foto de costas - Primeiro Acesso',
    TRUE,
    'back',
    group_uuid,
    NEW.uploaded_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para executar automaticamente
DROP TRIGGER IF EXISTS trigger_save_first_access_to_progress ON first_access_photos;
CREATE TRIGGER trigger_save_first_access_to_progress
  AFTER INSERT ON first_access_photos
  FOR EACH ROW
  EXECUTE FUNCTION save_first_access_to_progress();

-- 4. Migrar fotos antigas (se existirem)
-- Apenas fotos que ainda não foram migradas
DO $$
DECLARE
  photo_record RECORD;
  group_uuid UUID;
BEGIN
  FOR photo_record IN
    SELECT *
    FROM first_access_photos fap
    WHERE NOT EXISTS (
      SELECT 1
      FROM progress_photos pp
      WHERE pp.aluno_id = fap.aluno_id
        AND pp.is_first_access = TRUE
    )
  LOOP
    -- Gerar UUID para o grupo
    group_uuid := gen_random_uuid();

    -- Inserir as 3 fotos
    INSERT INTO progress_photos (aluno_id, photo_url, week_number, notes, is_first_access, position, group_id, created_at)
    VALUES
      (photo_record.aluno_id, photo_record.front_photo_url, 0, 'Foto frontal - Primeiro Acesso', TRUE, 'front', group_uuid, photo_record.uploaded_at),
      (photo_record.aluno_id, photo_record.side_photo_url, 0, 'Foto lateral - Primeiro Acesso', TRUE, 'side', group_uuid, photo_record.uploaded_at),
      (photo_record.aluno_id, photo_record.back_photo_url, 0, 'Foto de costas - Primeiro Acesso', TRUE, 'back', group_uuid, photo_record.uploaded_at);

    RAISE NOTICE 'Migradas fotos de primeiro acesso do aluno: %', photo_record.aluno_id;
  END LOOP;
END $$;

-- 5. Verificar quantas fotos foram migradas
SELECT
  COUNT(DISTINCT aluno_id) as alunos_com_fotos_primeiro_acesso,
  COUNT(*) as total_fotos_primeiro_acesso
FROM progress_photos
WHERE is_first_access = TRUE;

-- ✅ Sistema configurado! As fotos de primeiro acesso agora aparecem no histórico
