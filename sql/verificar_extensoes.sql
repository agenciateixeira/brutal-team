-- Verificar extensões instaladas
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
ORDER BY extname;

-- Habilitar pg_net se não estiver
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Verificar se pg_net está funcionando
SELECT extensions.http_get('https://httpbin.org/get');
