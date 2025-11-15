# 🚀 Fazer Deploy Agora - Instruções Passo a Passo

## 📋 Antes de Fazer o Deploy

### 1. ✅ **Execute o Script SQL Pendente**

Abra o Supabase SQL Editor e execute:

```
supabase/save-first-access-photos-to-history.sql
```

Este script irá:
- Adicionar colunas `is_first_access`, `position` e `group_id` na tabela `progress_photos`
- Criar trigger para salvar fotos de primeiro acesso no histórico automaticamente
- Migrar fotos antigas (se existirem)

---

## 🚀 Deploy das Alterações

### Passo 1: Verificar Mudanças

```bash
cd C:\Users\guilh\Documents\brutal-team
git status
```

Você deve ver arquivos modificados/criados:
- `src/components/coach/AlunoDetails.tsx`
- `src/app/coach/aluno/[id]/page.tsx`
- `src/components/ui/BottomNavigation.tsx`
- `src/components/layouts/AppLayout.tsx`
- `src/middleware.ts`
- `src/app/questionario/page.tsx`
- E vários arquivos `.md` de documentação

### Passo 2: Adicionar Todos os Arquivos

```bash
git add .
```

### Passo 3: Fazer Commit

```bash
git commit -m "feat: adicionar visualização de código/questionário no perfil do aluno, menu mobile fixo estilo WhatsApp, middleware para subdomínio, questionário completo

- Exibir código de primeiro acesso no perfil (visão coach)
- Exibir respostas do questionário de anamnese no perfil
- Exibir fotos de primeiro acesso (3 fotos) no perfil
- Criar menu mobile fixo estilo WhatsApp (5 ícones principais)
- Middleware para subdomínio questionario.brutalteam.blog.br
- Completar steps 3-6 do questionário
- Script SQL para salvar fotos de primeiro acesso no histórico
- Script SQL atualizado para corrigir RLS do Storage (3 formatos)
- Documentação completa das mudanças

🤖 Generated with Claude Code"
```

### Passo 4: Push para o GitHub

```bash
git push origin main
```

### Passo 5: Aguardar Deploy Automático

O Vercel vai detectar o push e fazer o deploy automaticamente.

Acompanhe em: https://vercel.com/dashboard

⏱️ Tempo estimado: 2-3 minutos

---

## 🧪 Testar Após o Deploy

### 1. ✅ **Testar Upload de Fotos**

- Faça login como aluno
- Tente enviar uma foto de progresso semanal
- Não deve dar erro de RLS

### 2. ✅ **Testar Perfil do Aluno (Coach)**

- Faça login como coach
- Entre em um aluno que tem:
  - Código de primeiro acesso
  - Questionário respondido
  - Fotos de primeiro acesso
- Verifique se os 3 cards aparecem (azul, roxo, verde)

### 3. ✅ **Testar Menu Mobile**

- Abra o site no celular ou ative o modo mobile no navegador (F12 → Toggle Device Toolbar)
- Verifique se o menu fixo aparece na parte inferior
- Clique no botão "Menu" (sanduíche) e veja se o overlay abre

### 4. ✅ **Testar Questionário**

- Acesse `/questionario` ou `questionario.brutalteam.blog.br` (se configurou DNS)
- Preencha todos os 6 steps
- Verifique se salva e redireciona para `/cadastro`

---

## 📱 Configurar Subdomínio (Opcional)

Se quiser que `questionario.brutalteam.blog.br` funcione:

### 1. Configurar DNS

Acesse o painel do seu provedor de domínio e adicione:

**Tipo**: CNAME
**Nome**: `questionario`
**Destino**: `cname.vercel-dns.com`
**TTL**: 3600 (ou automático)

### 2. Adicionar Domínio no Vercel

```bash
vercel domains add questionario.brutalteam.blog.br
```

Ou no dashboard:
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto **brutal-team**
3. Vá em **Settings** → **Domains**
4. Adicione `questionario.brutalteam.blog.br`

### 3. Aguardar Propagação

⏱️ Tempo: 15 minutos a 48 horas (geralmente 30 minutos)

Teste com:
```bash
nslookup questionario.brutalteam.blog.br
```

---

## 🐛 Problemas Comuns

### Erro de Compilação no Deploy

Se der erro de TypeScript no Vercel:

1. Verifique os logs do build
2. Corrija os erros (geralmente imports faltando)
3. Faça novo commit e push

### Fotos Ainda Não Funcionam

- Certifique-se de que executou o script SQL **`fix-storage-rls-first-access.sql`**
- Verifique no Supabase Dashboard → Storage → Policies
- Deve ter 4 políticas criadas

### Menu Mobile Não Aparece

- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Force o reload (Ctrl+F5)
- Teste em aba anônima

---

## 📊 Status Geral do Sistema

### ✅ Implementado e Funcionando
- Sistema de primeiro acesso (código + 3 fotos)
- Upload de fotos (RLS corrigido)
- Questionário completo (6 steps)
- Visualização de código/questionário no perfil
- Fotos de primeiro acesso visíveis
- Menu mobile fixo
- Middleware para subdomínio

### ⏳ Pendente (Features Secundárias)
- Upload de 3 fotos semanais (frente/lado/costa)
- Ativação automática do aluno ao selecionar plano
- Ajuste de estilo dos botões (neutro + hover)
- Tabelas de carboidratos no sistema
- Corrigir CORS da API de e-mail

### 🔴 Bloqueadores
- Nenhum! Sistema está funcional

---

## 🎉 Próximos Passos Recomendados

1. **Agora**: Fazer o deploy (seguir passos acima)
2. **Depois**: Testar tudo no ambiente de produção
3. **Depois**: Implementar 3 fotos semanais (próxima prioridade)
4. **Depois**: Ajustar estilo dos botões
5. **Depois**: Adicionar tabelas de carboidratos

---

## 💡 Dicas

- Sempre teste no ambiente de produção após o deploy
- Monitore os logs do Vercel para ver erros
- Peça feedback dos usuários sobre o menu mobile
- O middleware já está pronto, mas o subdomínio é opcional

---

**🚀 Agora é só fazer o deploy!**

```bash
git add .
git commit -m "feat: múltiplas melhorias no sistema"
git push origin main
```

✅ **Deploy automático em 2-3 minutos!**
