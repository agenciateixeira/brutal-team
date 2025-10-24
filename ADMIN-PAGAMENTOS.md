# 💰 Dashboard Administrativo - Sistema de Pagamentos

## ✅ O que foi criado?

### 1. **Banco de Dados**
- ✅ Campos adicionados na tabela `profiles`:
  - `payment_status`: Status do pagamento (active, pending, overdue, suspended)
  - `payment_due_date`: Data de vencimento
  - `monthly_fee`: Valor mensal da consultoria

- ✅ Nova tabela `payment_history`:
  - Histórico completo de todos os pagamentos
  - Registro de data, valor, método e observações
  - Vinculado ao aluno e ao mês de referência

### 2. **Dashboard Administrativo**
Nova página: `/admin/dashboard`

**5 Cards de Estatísticas:**
- 📊 **Total de Alunos**: Quantidade total cadastrada
- ✅ **Alunos Ativos**: Com pagamento em dia
- ⚠️ **Inadimplentes**: Pendentes ou atrasados
- 📈 **Pagaram este Mês**: Alunos que pagaram o mês atual
- 💵 **Receita Mensal**: Total recebido no mês

### 3. **Gerenciamento de Pagamentos**
- 🔍 **Busca**: Por nome ou email
- 🎯 **Filtro**: Por status de pagamento
- 📋 **Lista de Alunos**: Com todas as informações
- 💳 **Registro de Pagamento**: Modal para registrar novos pagamentos
- 🔄 **Atualizar Status**: Dropdown direto na tabela

### 4. **Sidebar Atualizada**
- Nova opção "Pagamentos" no menu do coach
- Ícone de cifrão ($) para identificação rápida

---

## 🚀 Como Usar

### Passo 1: Executar o SQL

Execute o arquivo `supabase-admin-payments.sql` no SQL Editor do Supabase:

1. Abra seu projeto no Supabase
2. Vá em **SQL Editor**
3. Clique em **+ New Query**
4. Cole o conteúdo do arquivo `supabase-admin-payments.sql`
5. Clique em **Run** ou `Ctrl+Enter`

### Passo 2: Configurar Valores Mensais (Opcional)

Se quiser definir valores padrão para alunos existentes:

```sql
-- Definir mensalidade de R$ 150,00 para todos os alunos
UPDATE profiles
SET monthly_fee = 150.00
WHERE role = 'aluno';
```

### Passo 3: Acessar o Dashboard Admin

1. Faça login como **coach** (guisdomkt@gmail.com)
2. No menu lateral, clique em **"Pagamentos"**
3. Você verá o dashboard administrativo completo

---

## 📊 Funcionalidades Detalhadas

### 1. Visualizar Estatísticas
No topo da página você vê os 5 cards com informações em tempo real:
- Total de alunos cadastrados
- Quantos estão com pagamento em dia
- Quantos estão inadimplentes
- Quantos pagaram este mês
- Total recebido no mês atual

### 2. Buscar e Filtrar Alunos
- **Campo de busca**: Digite nome ou email do aluno
- **Filtro por status**:
  - Todos
  - Ativos (pagamento em dia)
  - Pendentes (aguardando pagamento)
  - Atrasados (vencimento passou)
  - Suspensos (acesso bloqueado)

### 3. Alterar Status do Aluno
Clique no dropdown de status na linha do aluno e selecione:
- ✅ **Ativo**: Pagamento em dia
- ⏳ **Pendente**: Aguardando pagamento
- ⚠️ **Atrasado**: Vencimento passou
- 🚫 **Suspenso**: Acesso bloqueado

O status é atualizado instantaneamente no banco.

### 4. Registrar Pagamento

Clique em **"Registrar Pagamento"** na linha do aluno:

**Campos do formulário:**
- 💵 **Valor**: Valor recebido (pré-preenchido com a mensalidade)
- 📅 **Data do Pagamento**: Quando o pagamento foi recebido
- 📆 **Mês de Referência**: Qual mês está sendo pago (ex: 2025-01)
- 💳 **Método de Pagamento**: PIX, Cartão, Transferência, etc.
- 📝 **Observações**: Notas adicionais (opcional)

Ao confirmar:
- ✅ Pagamento é registrado no histórico
- ✅ Status do aluno muda para "Ativo"
- ✅ Estatísticas são atualizadas automaticamente

---

## 🎨 Cores dos Status

| Status | Cor | Significado |
|--------|-----|-------------|
| 🟢 Ativo | Verde | Pagamento em dia |
| 🟡 Pendente | Amarelo | Aguardando pagamento |
| 🔴 Atrasado | Vermelho | Vencimento passou |
| ⚪ Suspenso | Cinza | Acesso bloqueado |

---

## 📋 Histórico de Pagamentos

Todos os pagamentos registrados ficam salvos na tabela `payment_history` com:
- Data do pagamento
- Valor recebido
- Método de pagamento
- Mês de referência
- Observações
- Quem registrou (coach)

**Você pode consultar diretamente no Supabase:**
```sql
SELECT
  ph.*,
  p.full_name,
  p.email
FROM payment_history ph
JOIN profiles p ON p.id = ph.aluno_id
ORDER BY ph.payment_date DESC;
```

---

## 🔐 Segurança

### RLS Policies Configuradas:
- ✅ **Coach**: Pode ver, inserir e atualizar TODOS os pagamentos
- ✅ **Alunos**: Podem ver APENAS seus próprios pagamentos
- ✅ **Não autenticados**: Sem acesso

---

## 🎯 Próximas Features Sugeridas

Ainda não implementadas, mas podem ser úteis:
1. **Envio automático de cobranças** por email/WhatsApp
2. **Notificações** para alunos inadimplentes
3. **Relatórios mensais** em PDF
4. **Gráficos de receita** por período
5. **Exportação** para Excel
6. **Integração** com gateway de pagamento (Stripe, Mercado Pago)

---

## ⚙️ Exemplo de Uso Completo

### Cenário: Novo aluno se cadastrou

1. **Aluno** se cadastra no sistema
2. **Status inicial**: `active` (ou `null`)
3. **Coach** acessa `/admin/dashboard`
4. **Coach** vê o novo aluno na lista
5. **Coach** define a mensalidade (pode editar direto no banco ou criar tela para isso)
6. Quando o **aluno paga**, **coach** clica em "Registrar Pagamento"
7. Preenche o formulário com os dados do pagamento
8. Sistema atualiza:
   - ✅ Status do aluno → Ativo
   - ✅ Adiciona registro no histórico
   - ✅ Atualiza estatísticas do dashboard

### Cenário: Aluno não pagou este mês

1. **Coach** entra no dashboard
2. Vê que o aluno está com status "Pendente"
3. **Coach** pode:
   - Alterar status para "Atrasado"
   - Enviar mensagem/email cobrando (feature a ser implementada)
   - Alterar status para "Suspenso" se necessário

---

## 🐛 Troubleshooting

### Erro ao executar SQL
- ✅ Certifique-se de executar o SQL completo do arquivo
- ✅ Verifique se não há políticas com o mesmo nome já existentes

### Página 404 ao acessar /admin/dashboard
- ✅ Verifique se está logado como coach
- ✅ Faça refresh na página (F5)
- ✅ Limpe o cache do navegador

### Status não atualiza
- ✅ Verifique se as RLS policies foram criadas corretamente
- ✅ Verifique se o usuário é coach no banco de dados

---

## 📞 Estrutura de Arquivos Criados

```
src/
├── app/
│   └── admin/
│       └── dashboard/
│           └── page.tsx          # Página principal do admin
├── components/
│   └── admin/
│       └── PaymentManagement.tsx # Componente de gerenciamento
└── types/
    └── index.ts                  # Tipos atualizados (PaymentHistory, etc)

supabase-admin-payments.sql       # SQL para criar tabelas e políticas
ADMIN-PAGAMENTOS.md               # Este documento
```

---

**✅ Tudo pronto para usar!**

Execute o SQL e acesse `/admin/dashboard` para começar a gerenciar os pagamentos dos seus alunos! 🚀
