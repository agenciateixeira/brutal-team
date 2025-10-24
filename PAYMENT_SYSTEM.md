# Sistema de Pagamentos Automatizado

## Como Funciona

O sistema de pagamentos do Brutal Team gerencia automaticamente o status de pagamento dos alunos baseado em:
- Dia de vencimento mensal
- Data do último pagamento
- Período de carência de 3 dias

## Fluxo de Status

### 1. Primeiro Pagamento
Quando o coach registra o primeiro pagamento de um aluno:
- O dia do pagamento é salvo como `payment_due_day` (dia de vencimento mensal)
- O aluno recebe status `active`
- A data do pagamento é salva em `last_payment_date`

**Exemplo:** Se o pagamento foi registrado no dia 15, todo mês o aluno terá vencimento no dia 15.

### 2. Verificação Automática Diária
Um cron job executa diariamente às 00:00 (meia-noite) e verifica:

#### Cenário A: Pagamento em dia
- Se o aluno pagou no mês atual → Status: `active`

#### Cenário B: Vencimento chegou
- Se chegou o dia de vencimento e não foi pago → Status: `pending`

#### Cenário C: Inadimplência
- Se passaram 3 dias do vencimento sem pagamento → Status: `overdue`

### 3. Renovação Mensal
Quando o coach marca que o aluno pagou:
- Status volta para `active`
- `last_payment_date` é atualizado automaticamente
- O ciclo recomeça para o próximo mês

## Tabela de Status

| Status | Descrição | Cor |
|--------|-----------|-----|
| `active` | Pagamento em dia | Verde |
| `pending` | Venceu mas ainda não passou 3 dias | Amarelo |
| `overdue` | Passou 3 dias do vencimento | Vermelho |
| `suspended` | Conta suspensa manualmente | Cinza |

## Estrutura do Banco de Dados

### Campos Adicionados em `profiles`
```sql
payment_due_day INTEGER         -- Dia do mês do vencimento (1-31)
last_payment_date DATE          -- Data do último pagamento
payment_status TEXT             -- Status atual: active, pending, overdue, suspended
```

### Trigger Automático
Um trigger na tabela `payment_history` atualiza automaticamente:
- `last_payment_date` quando um pagamento é inserido
- `payment_status` para `active` ao receber pagamento

## Configuração

### 1. Executar SQL no Supabase
Execute o arquivo `sql/payment_automation.sql` no SQL Editor do Supabase para:
- Criar campos necessários
- Criar função `check_payment_status()`
- Criar triggers automáticos

### 2. Configurar Cron Secret (Opcional)
Adicione no Vercel ou arquivo `.env`:
```
CRON_SECRET=sua-chave-secreta-aleatoria
```

Se não configurar, será usado `dev-secret-key` em desenvolvimento.

### 3. Deploy
O Vercel automaticamente configura o cron job baseado no `vercel.json`:
- Executa diariamente às 00:00 UTC
- Chama `/api/cron/check-payments`
- Verifica e atualiza status de todos os alunos

## API Endpoints

### POST/GET `/api/cron/check-payments`
Executa verificação manual de status de pagamentos.

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Status de pagamentos verificados com sucesso",
  "timestamp": "2025-10-24T00:00:00.000Z"
}
```

## Exemplos de Uso

### Teste Manual da API
```bash
curl -X POST https://seu-app.vercel.app/api/cron/check-payments \
  -H "Authorization: Bearer dev-secret-key"
```

### Verificar Status de um Aluno
```sql
SELECT
  full_name,
  payment_status,
  payment_due_day,
  last_payment_date
FROM profiles
WHERE id = 'aluno-id';
```

## Manutenção

### Forçar Verificação
Pode chamar a função SQL manualmente:
```sql
SELECT check_payment_status();
```

### Alterar Dia de Vencimento
```sql
UPDATE profiles
SET payment_due_day = 10  -- Novo dia de vencimento
WHERE id = 'aluno-id';
```

### Resetar Status Manualmente
```sql
UPDATE profiles
SET
  payment_status = 'active',
  last_payment_date = CURRENT_DATE
WHERE id = 'aluno-id';
```

## Notas Importantes

1. **Fuso Horário:** O cron executa às 00:00 UTC. Ajuste conforme necessário.

2. **Meses com Menos Dias:** Se o dia de vencimento for 31 e o mês tiver 30 dias, o vencimento será no último dia do mês.

3. **Primeiro Dia Útil:** Se precisar ajustar para dia útil, modifique a função SQL.

4. **Notificações:** Para enviar emails/SMS, adicione lógica na função `check_payment_status()`.

5. **Histórico:** Todos os pagamentos ficam salvos em `payment_history` para auditoria.
