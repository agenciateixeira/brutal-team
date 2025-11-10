-- Ver todos os triggers ativos no banco
SELECT
  trigger_name,
  event_object_table as table_name,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Ver funções relacionadas a notificações
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%notif%'
    OR routine_name LIKE '%push%'
    OR routine_name LIKE '%dieta%'
    OR routine_name LIKE '%treino%'
  )
ORDER BY routine_name;
