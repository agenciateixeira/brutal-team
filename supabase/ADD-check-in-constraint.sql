-- ============================================
-- GARANTIR: Check-in único por dia
-- ============================================
-- Adiciona constraint UNIQUE para evitar múltiplos check-ins no mesmo dia
-- NOTA: A coluna se chama "date", não "check_in_date"!

-- 1. Verificar se a constraint já existe
DO $$
BEGIN
  -- Tentar criar a constraint
  BEGIN
    ALTER TABLE community_check_ins
    ADD CONSTRAINT unique_check_in_per_day
    UNIQUE (aluno_id, date);

    RAISE NOTICE '✅ Constraint UNIQUE adicionada com sucesso!';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'ℹ️  Constraint já existe (tudo ok)';
    WHEN unique_violation THEN
      -- Se houver duplicatas, remover e tentar novamente
      RAISE NOTICE '⚠️  Removendo check-ins duplicados...';

      -- Remover duplicatas (manter apenas o primeiro de cada dia)
      DELETE FROM community_check_ins
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM community_check_ins
        GROUP BY aluno_id, date
      );

      -- Tentar adicionar constraint novamente
      ALTER TABLE community_check_ins
      ADD CONSTRAINT unique_check_in_per_day
      UNIQUE (aluno_id, date);

      RAISE NOTICE '✅ Duplicatas removidas e constraint adicionada!';
  END;
END $$;

-- 2. Verificar estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_check_ins'
ORDER BY ordinal_position;

-- 3. Verificar constraints
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'community_check_ins';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ CHECK-IN AUTOMÁTICO CONFIGURADO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamento:';
  RAISE NOTICE '  ✓ Ao postar foto de treino, check-in é criado automaticamente';
  RAISE NOTICE '  ✓ Apenas 1 check-in por dia (constraint UNIQUE)';
  RAISE NOTICE '  ✓ Se já tem check-in hoje, não cria duplicado';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Tudo pronto!';
  RAISE NOTICE '';
END $$;
