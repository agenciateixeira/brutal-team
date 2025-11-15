# Scripts SQL - Stripe Connect

Esta pasta contém todos os scripts SQL necessários para configurar as tabelas relacionadas ao Stripe Connect no Supabase.

## 📋 Ordem de Execução

Execute os scripts na seguinte ordem:

### 1. `01_connected_accounts.sql`
Cria a tabela `connected_accounts` para armazenar informações das contas Stripe Connect dos coaches.

**O que faz:**
- Cria tabela principal de contas conectadas
- Adiciona índices para performance
- Documenta as colunas

**Campos principais:**
- `stripe_account_id`: ID da conta no Stripe
- `charges_enabled`: Se pode processar pagamentos
- `payouts_enabled`: Se pode receber transferências
- `account_status`: Status da conta (pending, active, disabled)

### 2. `02_transactions.sql`
Cria a tabela `transactions` para registrar todos os pagamentos da plataforma.

**O que faz:**
- Cria tabela de transações
- Calcula automaticamente o valor líquido (amount - fee_amount)
- Adiciona índices para consultas rápidas

**Campos principais:**
- `stripe_payment_intent_id`: ID do pagamento no Stripe
- `amount`: Valor total em centavos
- `fee_amount`: Taxa da plataforma (2%)
- `net_amount`: Valor líquido calculado automaticamente
- `status`: Status do pagamento
- `student_id`: Aluno que pagou
- `coach_id`: Coach que recebeu

### 3. `03_profiles_stripe_columns.sql`
Adiciona colunas relacionadas ao Stripe na tabela `profiles` existente.

**O que faz:**
- Verifica se as colunas já existem (seguro rodar múltiplas vezes)
- Adiciona colunas Stripe Connect para coaches
- Adiciona colunas de Customer e Subscription para alunos
- Cria índices nas novas colunas

**Colunas adicionadas:**
- `stripe_account_id`: Conta Stripe Connect do coach
- `stripe_charges_enabled`: Se KYC está completo
- `stripe_payouts_enabled`: Se dados bancários configurados
- `stripe_customer_id`: ID do cliente no Stripe (alunos)
- `stripe_subscription_id`: ID da assinatura (coaches)
- `stripe_subscription_status`: Status da assinatura

## 🚀 Como Aplicar

### Opção 1: Via Dashboard do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Crie uma nova query
5. Copie e cole o conteúdo de cada arquivo **na ordem** (01, 02, 03)
6. Execute cada script clicando em "Run"

### Opção 2: Via CLI do Supabase

```bash
# 1. Conectar ao seu projeto
supabase link --project-ref your-project-ref

# 2. Executar os scripts na ordem
supabase db execute < sql-stripe/01_connected_accounts.sql
supabase db execute < sql-stripe/02_transactions.sql
supabase db execute < sql-stripe/03_profiles_stripe_columns.sql
```

### Opção 3: Copiar e Colar Todos de Uma Vez

Você pode copiar todos os scripts em sequência e executar de uma vez:

```sql
-- Copie o conteúdo de 01_connected_accounts.sql aqui

-- Depois copie o conteúdo de 02_transactions.sql aqui

-- Por fim copie o conteúdo de 03_profiles_stripe_columns.sql aqui
```

## ✅ Verificação

Após executar os scripts, verifique se tudo foi criado corretamente:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('connected_accounts', 'transactions');

-- Verificar se as colunas foram adicionadas em profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name LIKE 'stripe%';
```

## 📊 Estrutura das Tabelas

### connected_accounts
```
id                  | UUID (PK)
user_id             | UUID (FK -> auth.users)
stripe_account_id   | TEXT (UNIQUE)
charges_enabled     | BOOLEAN
payouts_enabled     | BOOLEAN
account_status      | TEXT
created_at          | TIMESTAMPTZ
updated_at          | TIMESTAMPTZ
```

### transactions
```
id                      | UUID (PK)
stripe_payment_intent_id| TEXT (UNIQUE)
connected_account_id    | TEXT (FK -> connected_accounts)
amount                  | INTEGER (centavos)
fee_amount              | INTEGER (centavos)
net_amount              | INTEGER (calculado automaticamente)
status                  | TEXT
student_id              | UUID (FK -> profiles)
coach_id                | UUID (FK -> profiles)
description             | TEXT
metadata                | JSONB
created_at              | TIMESTAMPTZ
updated_at              | TIMESTAMPTZ
```

## 🔐 Permissões RLS (Row Level Security)

Após criar as tabelas, configure as políticas de segurança:

```sql
-- Habilitar RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para connected_accounts
CREATE POLICY "Coaches podem ver suas próprias contas"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Coaches podem ver suas transações"
  ON transactions FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE stripe_account_id = connected_account_id
  ));

CREATE POLICY "Alunos podem ver suas transações"
  ON transactions FOR SELECT
  USING (auth.uid() = student_id);
```

## ⚠️ Importante

- Os scripts são **idempotentes** (seguros para executar múltiplas vezes)
- O script `03_profiles_stripe_columns.sql` verifica se as colunas já existem antes de criar
- Não apague as tabelas existentes - os scripts adicionam apenas o que falta
- Valores em centavos: R$ 100,00 = 10000 centavos

## 🐛 Troubleshooting

### Erro: "relation already exists"
Se a tabela já existe, o script vai apenas pular a criação. Isso é normal.

### Erro: "column already exists"
O script `03_profiles_stripe_columns.sql` já trata isso automaticamente.

### Erro: "permission denied"
Certifique-se de estar usando a chave de serviço (service_role) no Supabase.

## 📝 Próximos Passos

Após aplicar os scripts SQL:

1. Configure os webhooks do Stripe
2. Teste o fluxo de cadastro de coach
3. Teste o processamento de pagamentos
4. Verifique os dados sendo salvos corretamente nas tabelas
