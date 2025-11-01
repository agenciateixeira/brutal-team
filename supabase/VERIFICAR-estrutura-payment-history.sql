-- ============================================
-- VERIFICAR ESTRUTURA REAL DA TABELA payment_history
-- Para descobrir quais colunas realmente existem
-- ============================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'ESTRUTURA DA TABELA payment_history';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Listar todas as colunas da tabela
  FOR rec IN
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_history'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Coluna: %', rec.column_name;
    RAISE NOTICE '  Tipo: %', rec.data_type;
    RAISE NOTICE '  Nullable: %', rec.is_nullable;
    RAISE NOTICE '  Default: %', rec.column_default;
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
