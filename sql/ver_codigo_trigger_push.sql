-- Ver o código completo do trigger e da função
SELECT
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'send_push_on_notification';
