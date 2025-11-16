# 📋 Documentação - Sistema de Pagamentos Stripe Connect
**Data:** 15 de Novembro de 2024
**Sessão:** Implementação completa do sistema de assinaturas recorrentes

---

## 🎯 O que foi implementado hoje

### 1. Sistema de Convites de Pagamento (Guest Checkout)

**Fluxo implementado:**
```
Coach → Cria convite → Envia link → Aluno paga → Webhook cria usuário → Email enviado
```

**Arquivos criados:**
- `/src/app/api/student/subscribe-to-coach-guest/route.ts` - Checkout sem autenticação
- `/src/app/api/coach/create-payment-invitation/route.ts` - Criar convites
- `/src/app/api/coach/list-payment-invitations/route.ts` - Listar convites
- `/src/app/pagamento/[token]/page.tsx` - Página de checkout para aluno
- `/src/app/pagamento/sucesso/page.tsx` - Página de confirmação
- `supabase/create-payment-invitations.sql` - Tabela de convites

**Características:**
- ✅ Token único de 32 caracteres
- ✅ Expiração de 7 dias
- ✅ Status: pending → completed
- ✅ Link direto via WhatsApp
- ✅ Copia link com toast notification

---

### 2. Sistema de Email via Resend

**Configuração:**
- **Provedor:** Resend
- **Domínio:** brutalteam.blog.br (verificado)
- **Email:** noreply@brutalteam.blog.br
- **API Key:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (configurada no .env)

**Arquivos criados:**
- `/src/lib/resend.ts` - Helper e template de email
- Template HTML responsivo com logo Brutal Team

**Variável de ambiente necessária (Vercel):**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Template do email:**
- Header com gradiente azul + logo
- Boas-vindas personalizadas com nome do aluno
- Menção ao coach
- Botão CTA "Definir Minha Senha"
- Lista de próximos passos
- Footer com copyright
- Design 100% responsivo

---

### 3. Webhook do Stripe (Modificado)

**Arquivo:** `/src/app/api/webhooks/stripe/route.ts`

**Nova funcionalidade no `checkout.session.completed`:**
1. Detecta guest checkout pelo `invitation_token`
2. Verifica se usuário já existe no auth
3. Cria usuário via `supabase.auth.admin.createUser()`
4. Cria profile na tabela `profiles`
5. Busca nome do coach
6. Gera link de reset via `supabase.auth.admin.generateLink()`
7. Envia email via Resend com `sendWelcomeEmail()`
8. Marca convite como `completed`

**Secret do Webhook (configurado):**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> **⚠️ Importante:** O secret real está configurado nas variáveis de ambiente do Vercel.

---

### 4. Botão "Reenviar Email de Boas-vindas"

**Arquivo:** `/src/app/api/coach/resend-welcome-email/route.ts`

**Localização:** Tabela "Alunos Ativos" em `/coach/alunos`

**Funcionalidade:**
- Ícone de email (Mail) ao lado de cada aluno
- Valida que aluno pertence ao coach
- Gera novo link de reset
- Envia email via Resend
- Toast de confirmação

---

### 5. Botão "Processar" (Solução para webhook falho)

**Arquivo:** `/src/app/api/coach/process-invitation-manually/route.ts`

**Localização:** Tabela "Convites Pendentes" em `/coach/alunos`

**Quando usar:**
- Pagamento foi confirmado no Stripe
- Webhook não foi executado ou falhou
- Usuário não foi criado automaticamente

**O que faz:**
- Executa TODAS as ações do webhook manualmente
- Cria usuário + profile
- Envia email
- Marca convite como completed
- Move para "Alunos Ativos"

**Cor:** Laranja (destaque)

---

### 6. Modificações na UI

**Página `/coach/alunos` atualizada:**
- ✅ Ícone Copy ao invés de texto
- ✅ Ícone SVG do WhatsApp customizado
- ✅ Toast notifications (substituiu alerts)
- ✅ Botão "Processar" laranja nos convites
- ✅ Botão "Email" azul nos alunos ativos
- ✅ Responsivo mobile

**Página `/pagamento/[token]` atualizada:**
- ✅ Removidos campos de senha
- ✅ Logo Brutal Team ao invés de texto
- ✅ Aviso: "Você receberá email..."
- ✅ Apenas telefone (opcional) e termos

---

## 🔴 Problemas Encontrados e Soluções

### Problema 1: Erro 406 ao verificar email
**Causa:** RLS policy não permitia leitura sem autenticação

**Solução:**
```sql
-- Arquivo: supabase/fix-profiles-rls-select.sql
CREATE POLICY "Public read access to profiles"
ON profiles FOR SELECT
USING (true);
```

### Problema 2: "No such customer" no Stripe
**Causa:** Customer criado na conta principal, não na Connected Account

**Solução:**
```typescript
// ANTES (errado):
const customer = await stripe.customers.create({...})

// DEPOIS (correto):
const customer = await stripe.customers.create(
  {...},
  { stripeAccount: coachProfile.stripe_account_id } // ✅
)
```

### Problema 3: Webhook não executando
**Status:** AINDA NÃO RESOLVIDO ⚠️

**Evidência:**
- Pagamento aprovado no Stripe
- Usuário NÃO criado no banco
- Convite permanece "pending"

**Solução temporária:**
- Botão "Processar" manual criado
- Permite processar convites manualmente

**Próximos passos para investigar:**
1. Verificar logs do webhook no Stripe Dashboard
2. Testar webhook localmente com ngrok
3. Verificar se URL do webhook está correta
4. Confirmar que eventos estão sendo enviados

---

## 📦 Dependências Adicionadas

```json
{
  "resend": "^3.x.x"
}
```

Instalado com:
```bash
npm install resend
```

---

## 🔐 Variáveis de Ambiente

### Locais (`.env.local`):
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vercel (configurar manualmente):
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Status:** ✅ Já configurado no Vercel

> **🔒 Segurança:** As credenciais reais estão nas variáveis de ambiente. Nunca commite valores reais no Git.

---

## 🗄️ Schema do Banco (payment_invitations)

```sql
CREATE TABLE payment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  amount INTEGER NOT NULL,
  interval TEXT NOT NULL DEFAULT 'month',
  due_day INTEGER,
  trial_days INTEGER DEFAULT 0,
  description TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  subscription_id UUID REFERENCES subscriptions(id),
  student_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Função para gerar token:**
```sql
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Próximos Passos

### 1. ⚠️ PRIORITÁRIO: Investigar webhook do Stripe

**Onde verificar:**
1. Stripe Dashboard → Developers → Webhooks
2. Verificar URL: `https://app.brutalteam.blog.br/api/webhooks/stripe`
3. Ver logs de tentativas de envio
4. Verificar se eventos `checkout.session.completed` estão sendo enviados

**Como testar localmente:**
```bash
# 1. Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Escutar webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. Fazer teste de pagamento e ver logs
```

**Se webhook estiver configurado errado:**
- Deletar webhook antigo
- Criar novo apontando para: `https://app.brutalteam.blog.br/api/webhooks/stripe`
- Selecionar evento: `checkout.session.completed`
- Copiar novo Webhook Secret
- Atualizar `STRIPE_WEBHOOK_SECRET` no .env e Vercel

---

### 2. Melhorias de UX

**Email:**
- [ ] Customizar mais o template (adicionar mais cores da marca)
- [ ] Adicionar link direto para login após definir senha
- [ ] Email de confirmação de pagamento separado

**Dashboard:**
- [ ] Adicionar filtro na tabela de alunos (buscar por nome/email)
- [ ] Gráfico de receita mensal
- [ ] Notificação quando novo aluno assina

---

### 3. Features Futuras

**Sistema de Assinaturas:**
- [ ] Planos customizados por coach (Bronze/Silver/Gold)
- [ ] Cupons de desconto
- [ ] Período de trial configurável por convite
- [ ] Renovação automática com cobrança em dia específico

**Comunicação:**
- [ ] Email quando assinatura está próxima de vencer
- [ ] Email quando pagamento falha
- [ ] WhatsApp API integration para notificações

**Analytics:**
- [ ] Dashboard de métricas para coach:
  - Taxa de conversão de convites
  - Churn rate
  - LTV (Lifetime Value)
  - MRR growth

---

### 4. Segurança

**Implementar:**
- [ ] Rate limiting nas APIs públicas
- [ ] CAPTCHA no formulário de checkout
- [ ] Webhook signature verification (já tem, mas testar)
- [ ] Logs detalhados de todas operações de pagamento

---

### 5. Testes

**Criar testes para:**
- [ ] Fluxo completo de convite → pagamento → webhook
- [ ] Processamento manual quando webhook falha
- [ ] Reenvio de email
- [ ] Validações de RLS

---

## 📝 Comandos Úteis

### Desenvolvimento:
```bash
# Rodar localmente
npm run dev

# Build de produção
npm run build

# Testar webhook localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Git:
```bash
# Ver status
git status

# Commitar mudanças
git add -A
git commit -m "sua mensagem"
git push

# Ver histórico
git log --oneline -10
```

### Supabase:
```bash
# Executar migration
psql -h [host] -U postgres -d postgres -f supabase/arquivo.sql

# Ou via dashboard:
# https://supabase.com/dashboard/project/kelmdelbrqsznzckznfb/editor
```

---

## 🔍 Como Debugar Problemas

### Se aluno não receber email:
1. Verificar logs do webhook no Stripe Dashboard
2. Verificar se variável `RESEND_API_KEY` está no Vercel
3. Usar botão "Reenviar Email" na tabela de alunos
4. Verificar spam no email do aluno

### Se convite ficar "pending" após pagamento:
1. Verificar no Stripe se pagamento foi aprovado
2. Verificar logs do webhook (eventos recebidos?)
3. Usar botão "Processar" manual
4. Verificar no banco se usuário existe:
```sql
SELECT * FROM profiles WHERE email = 'email@aluno.com';
```

### Se webhook não executar:
1. Stripe Dashboard → Webhooks → Ver tentativas
2. Verificar URL está correta
3. Testar com Stripe CLI localmente
4. Verificar `STRIPE_WEBHOOK_SECRET` está correto

---

## 🎓 Conceitos Importantes

### Stripe Connect - Direct Charges
- Pagamento vai DIRETO para conta do coach
- Plataforma leva 2% via `application_fee_percent`
- Coach recebe 98% automaticamente
- Não precisa de transferências manuais

### Guest Checkout
- Aluno NÃO precisa criar conta antes de pagar
- Apenas preenche dados básicos e aceita termos
- Conta é criada DEPOIS do pagamento (via webhook)
- Evita abandono de carrinho

### Supabase RLS (Row Level Security)
- Controla quem pode ler/escrever dados
- Policy "Public read" permite leitura sem auth
- Coach só vê seus próprios alunos
- Service Role bypassa RLS (usar com cuidado!)

### Webhooks
- Stripe avisa nosso servidor quando algo acontece
- Eventos assíncronos (não instantâneos)
- Precisa validar signature para segurança
- Retry automático se servidor estiver offline

---

## 📞 Contas e Credenciais

### Stripe Connect
- **Account ID (Plataforma):** `acct_xxxxxxxxxxxxxxxxxxxxx` (configurado no .env)
- **Webhook Secret:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (configurado no .env)
- **Fee da plataforma:** 2%

### Resend
- **Domínio:** brutalteam.blog.br
- **API Key:** `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (configurado no .env)
- **Email:** noreply@brutalteam.blog.br
- **Limite:** Grátis até 3.000 emails/mês

### Supabase
- **URL:** https://kelmdelbrqsznzckznfb.supabase.co
- **Project ID:** kelmdelbrqsznzckznfb

> **🔒 Nota de Segurança:** Credenciais sensíveis foram removidas desta documentação. Os valores reais estão configurados nas variáveis de ambiente (.env.local e Vercel).

---

## ✅ Checklist para Continuar

Antes de retomar o trabalho:

- [ ] Verificar se todos os deploys do Vercel foram bem-sucedidos
- [ ] Testar fluxo completo: convite → pagamento → email
- [ ] Investigar por que webhook não executou no primeiro teste
- [ ] Resolver problema do webhook (PRIORITÁRIO)
- [ ] Documentar solução do webhook
- [ ] Fazer backup do banco de dados
- [ ] Revisar todas as variáveis de ambiente

---

## 📊 Status Atual

| Feature | Status | Notas |
|---------|--------|-------|
| Sistema de Convites | ✅ Completo | Funcionando |
| Guest Checkout | ✅ Completo | Funcionando |
| Email via Resend | ✅ Completo | Template bonito |
| Webhook | ⚠️ Parcial | Não executou no teste |
| Processar Manual | ✅ Completo | Solução temporária |
| Reenviar Email | ✅ Completo | Funcionando |
| RLS Policies | ✅ Completo | Configurado |
| UI/UX | ✅ Completo | Ícones e toasts |

---

## 🐛 Bugs Conhecidos

1. **Webhook não executa** (CRÍTICO)
   - Evidência: Convite permanece "pending"
   - Workaround: Botão "Processar" manual
   - TODO: Investigar configuração do webhook

---

## 💡 Lições Aprendidas

1. **Customers do Stripe são por conta**
   - Não são compartilhados entre contas
   - Sempre criar na Connected Account do coach

2. **RLS precisa permitir leitura pública**
   - Guest checkout precisa ler profiles
   - Usar `USING (true)` para leitura pública

3. **Webhook pode falhar**
   - Sempre ter plano B (processamento manual)
   - Logs são essenciais para debug

4. **Email personalizado > Email padrão**
   - Resend dá mais controle
   - Template customizado melhora experiência

---

**Última atualização:** 15/11/2024
**Próxima sessão:** Investigar e resolver webhook do Stripe
