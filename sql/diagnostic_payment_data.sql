-- Diagnóstico de dados de pagamento
-- Executar este script para verificar se há dados nas tabelas

-- 1. Verificar total de pagamentos
SELECT
  COUNT(*) as total_pagamentos,
  SUM(amount) as valor_total,
  MIN(payment_date) as primeiro_pagamento,
  MAX(payment_date) as ultimo_pagamento,
  MIN(created_at) as primeiro_created,
  MAX(created_at) as ultimo_created
FROM payment_history;

-- 2. Ver os últimos 10 pagamentos
SELECT
  id,
  aluno_id,
  amount,
  payment_date,
  created_at,
  status
FROM payment_history
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar total de planos de alunos
SELECT
  COUNT(*) as total_planos,
  COUNT(CASE WHEN is_active = true THEN 1 END) as planos_ativos,
  COUNT(CASE WHEN is_active = false THEN 1 END) as planos_inativos,
  SUM(monthly_value) as mrr_total
FROM student_plans;

-- 4. Ver os planos ativos
SELECT
  id,
  aluno_id,
  monthly_value,
  is_active,
  created_at
FROM student_plans
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar se há alunos sem pagamentos
SELECT
  sp.aluno_id,
  p.full_name,
  sp.monthly_value,
  sp.is_active,
  COUNT(ph.id) as total_pagamentos
FROM student_plans sp
LEFT JOIN profiles p ON p.id = sp.aluno_id
LEFT JOIN payment_history ph ON ph.aluno_id = sp.aluno_id
GROUP BY sp.aluno_id, p.full_name, sp.monthly_value, sp.is_active
ORDER BY total_pagamentos DESC;

-- 6. Verificar estrutura das datas
SELECT
  payment_date,
  created_at,
  TO_CHAR(payment_date, 'YYYY-MM-DD') as payment_date_formatted,
  TO_CHAR(created_at, 'YYYY-MM-DD') as created_at_formatted
FROM payment_history
LIMIT 5;
