-- ============================================
-- VERIFICAR ESTRUTURA DA TABELA PROFILES
-- Para descobrir quais colunas realmente existem
-- ============================================

DO $$
DECLARE
  col_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ESTRUTURA DA TABELA public.profiles';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Listar todas as colunas da tabela
  FOR col_rec IN
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Coluna: %', col_rec.column_name;
    RAISE NOTICE '  Tipo: %', col_rec.data_type;
    RAISE NOTICE '  Nullable: %', col_rec.is_nullable;
    RAISE NOTICE '  Default: %', COALESCE(col_rec.column_default, '(sem default)');
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
