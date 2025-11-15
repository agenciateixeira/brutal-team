-- Adicionar campos de medidas corporais na tabela progress_photos
ALTER TABLE public.progress_photos
ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS cintura DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS biceps_contraido DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pernas DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS panturrilha DECIMAL(5,2);

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.progress_photos.peso IS 'Peso corporal em kg';
COMMENT ON COLUMN public.progress_photos.cintura IS 'Medida da cintura em cm';
COMMENT ON COLUMN public.progress_photos.biceps_contraido IS 'Medida do bíceps contraído em cm';
COMMENT ON COLUMN public.progress_photos.pernas IS 'Medida das pernas (1 palmo acima do joelho) em cm';
COMMENT ON COLUMN public.progress_photos.panturrilha IS 'Medida da panturrilha em cm';
