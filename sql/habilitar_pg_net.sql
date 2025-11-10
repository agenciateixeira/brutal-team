-- ========================================
-- HABILITAR EXTENSÃO PG_NET
-- Necessária para enviar requisições HTTP do banco de dados
-- ========================================

-- 1. Habilitar a extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Dar permissões para postgres usar a extensão
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- 3. Testar se está funcionando
SELECT net.http_get(
  'https://httpbin.org/status/200'
) as test_request_id;

-- 4. Ver requisições pendentes (se houver)
SELECT * FROM net.http_request_queue LIMIT 5;

-- 5. Verificar se a extensão está habilitada
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pg_net';
