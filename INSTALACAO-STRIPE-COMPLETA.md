# 🚀 Instalação Completa - Sistema de Pagamentos Stripe

## ✅ O que foi criado:

### 1. Banco de Dados (Supabase)
- ✅ Campos Stripe na tabela `profiles`
- ✅ Tabela `invite_tokens` (convites de alunos)
- ✅ Tabela `payments` (pagamentos)
- ✅ Tabela `subscriptions` (assinaturas)

### 2. Backend (API Routes)
- ✅ `/api/stripe/create-connect-account` - Criar conta Stripe Connect
- ✅ `/api/stripe/create-checkout-session` - Checkout embedded
- ✅ `/api/stripe/verify-session` - Verificar pagamento

### 3. Frontend (Páginas)
- ✅ `/cadastro-profissional` - Cadastro do coach
- ✅ `/coach/escolher-plano` - Escolha de plano (embedded)
- ✅ `/coach/pagamento-sucesso` - Confirmação de pagamento

### 4. Configuração
- ✅ Variáveis de ambiente no `.env.local`
- ✅ Documentação completa

---

## 📦 Passo 1: Instalar Dependências

Abra o terminal e execute:

```bash
cd /Users/guilhermeteixeira/Documents/PROJETOS/brutal-team

# Instalar TODAS as dependências do projeto
npm install

# Instalar dependências Stripe específicas
npm install stripe @stripe/stripe-js @stripe/react-stripe-js nanoid
```

---

## 🔧 Passo 2: Verificar Variáveis de Ambiente

O arquivo `.env.local` já está configurado com:

```env
# Stripe Connect
STRIPE_SECRET_KEY=rk_live_51M96wZ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51M96wZ...
STRIPE_ACCOUNT_ID=acct_1STLBmFNseQuOFRP
```

✅ **Já está pronto!**

---

## 🎯 Passo 3: Testar o Fluxo Completo

### 3.1 Rodar o servidor

```bash
npm run dev
```

### 3.2 Acessar o cadastro de profissional

Abra no navegador:
```
http://localhost:3000/cadastro-profissional
```

### 3.3 Fluxo de teste:

1. **Preencher formulário de cadastro**
   - Nome, email, telefone, CPF, senha

2. **Criar conta**
   - Sistema cria usuário no Supabase
   - Cria conta Stripe Connect automaticamente
   - Redireciona para escolha de plano

3. **Escolher plano**
   - Básico (R$ 29,90), Pro (R$ 79,90) ou Premium (R$ 149,90)
   - Checkout **embedded** (sem sair do app)

4. **Pagar**
   - Use cartão de teste do Stripe:
     - Número: `4242 4242 4242 4242`
     - Validade: qualquer data futura
     - CVV: qualquer 3 dígitos
     - CEP: qualquer

5. **Confirmação**
   - Redireciona para página de sucesso
   - Ativa assinatura no banco
   - Libera acesso ao dashboard do coach

---

## 🧪 Cartões de Teste Stripe

Para testar pagamentos:

### Sucesso
```
Número: 4242 4242 4242 4242
Validade: 12/34
CVV: 123
```

### Falha (cartão recusado)
```
Número: 4000 0000 0000 0002
```

### Requer autenticação 3D Secure
```
Número: 4000 0027 6000 3184
```

---

## 📋 Passo 4: Verificar se Funcionou

### 4.1 Verificar no Supabase

Acesse: https://supabase.com/dashboard

1. Vá em **Table Editor** → `profiles`
2. Encontre o usuário criado
3. Verifique os campos:
   - `stripe_account_id` - deve ter um ID (acct_xxx)
   - `stripe_customer_id` - deve ter um ID (cus_xxx)
   - `stripe_subscription_id` - deve ter um ID (sub_xxx)
   - `stripe_subscription_status` - deve ser `active`
   - `subscription_plan` - deve ser `basic`, `pro` ou `premium`
   - `approved` - deve ser `true`

### 4.2 Verificar no Stripe Dashboard

Acesse: https://dashboard.stripe.com/

1. **Connect** → **Accounts**
   - Deve aparecer uma nova conta conectada

2. **Customers**
   - Deve aparecer o customer criado

3. **Subscriptions**
   - Deve aparecer a assinatura ativa

---

## ⚠️ Problemas Comuns

### Erro: "stripe is not defined"
**Solução:** Verifique se instalou as dependências:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Erro: "STRIPE_SECRET_KEY is not defined"
**Solução:** Reinicie o servidor após adicionar as env vars:
```bash
# Ctrl+C para parar
npm run dev
```

### Checkout não aparece
**Solução:** Verifique se a `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` está no `.env.local`

### Erro 401 na API
**Solução:** Usuário não está autenticado. Faça login primeiro.

---

## 🔄 Próximos Passos

Depois que testar e confirmar que está funcionando:

1. **Criar produtos no Stripe Dashboard**
   - Ir em Products → Create product
   - Criar 3 produtos (Básico, Pro, Premium)
   - Copiar os Price IDs
   - Atualizar no código (opcional - por enquanto está criando dinamicamente)

2. **Configurar Webhook**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://seudominio.com/api/stripe/webhook`
   - Selecionar eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copiar o webhook secret
   - Adicionar no `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

3. **Testar em produção**
   - Deploy na Vercel
   - Configurar env vars na Vercel
   - Testar com cartão real (modo live)

---

## 📚 Documentação

- **Documentação completa:** `SISTEMA-PAGAMENTOS-STRIPE-CONNECT.md`
- **Stripe Docs:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com/

---

## 🆘 Se precisar de ajuda

1. Verifique os logs no terminal
2. Verifique o console do navegador (F12)
3. Verifique os logs do Stripe Dashboard
4. Me chame se precisar!

---

**Criado em:** 2025-11-14
**Status:** Pronto para testar
