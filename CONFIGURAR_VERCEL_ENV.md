# ⚠️ CONFIGURAÇÃO IMPORTANTE - VARIÁVEIS DE AMBIENTE VERCEL

## Problema Resolvido
A aprovação de alunos estava falhando devido a políticas RLS do Supabase.
Agora usamos API routes server-side que precisam da **Service Role Key**.

## 📝 Passo a Passo para Configurar

### 1. Obter a Service Role Key do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **Brutal Team**
3. Vá em: **Settings** (⚙️) → **API**
4. Na seção **Project API keys**, copie a chave **`service_role`**
   - ⚠️ Esta chave é SECRETA - nunca compartilhe publicamente!
   - Ela bypassa Row Level Security (RLS)

### 2. Adicionar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: **brutal-team**
3. Vá em: **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Configure:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Cole a chave copiada do Supabase
   - **Environment:** Marque todas (Production, Preview, Development)
6. Clique em **Save**

### 3. Redeploy do Projeto

Após adicionar a variável, você precisa fazer um redeploy:

**Opção A - Redeploy Manual:**
1. Vá em **Deployments**
2. Encontre o deployment mais recente
3. Clique nos 3 pontinhos (⋯) → **Redeploy**

**Opção B - Commit Vazio (automático):**
```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

### 4. Verificar se Funcionou

1. Acesse o dashboard do coach
2. Tente aprovar um aluno pendente
3. Verifique no console do navegador (F12):
   - ✅ Deve aparecer: `"Aluno aprovado: {success: true, data: [...]}"`
   - ❌ NÃO deve aparecer: `"Array(0)"` ou erros

## 🔍 Troubleshooting

### Se ainda aparecer "Array(0)":
- Verifique se a variável foi salva corretamente no Vercel
- Certifique-se de que fez o redeploy após adicionar
- Verifique se copiou a chave **service_role** (não a anon key)

### Se aparecer erro 500 na API:
- Vá em Vercel → Functions → Logs
- Procure por erros relacionados a `approve-aluno` ou `reject-aluno`
- Verifique se a variável NEXT_PUBLIC_SUPABASE_URL também está configurada

## 📚 Mais Informações

- **Documentação Supabase Service Role:** https://supabase.com/docs/guides/api/api-keys
- **Documentação Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables

---

**Criado em:** 2025-01-24
**Última atualização:** Correção de aprovação de alunos (commit c7f7540)
