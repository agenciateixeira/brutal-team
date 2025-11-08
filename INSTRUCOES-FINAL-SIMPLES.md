# 🔧 INSTRUÇÕES FINAIS - SIMPLES E DIRETO

## ❌ O QUE ACONTECEU?

As policies ficaram muito complexas e restritivas. Resultado:
- ❌ Erro 403 ao postar
- ❌ Posts sumiram
- ❌ Amigos da rede sumiram
- ❌ Não consegue usar a comunidade

---

## ✅ SOLUÇÃO DEFINITIVA

Execute **1 ÚNICO SQL** no Supabase:

### **`CORRIGIR-POLICIES-FINAL.sql`**

---

## 📋 COMO EXECUTAR:

1. Acesse: https://supabase.com
2. Vá em **SQL Editor**
3. Clique em **"New query"**
4. Abra o arquivo: **`CORRIGIR-POLICIES-FINAL.sql`**
5. Copie **TODO** o conteúdo
6. Cole no SQL Editor
7. Clique em **"Run"**
8. Aguarde sucesso ✅

---

## 🎯 O QUE ESSE SQL FAZ?

### 1. LIMPA TUDO
- Remove TODAS as policies antigas (que estavam bugadas)

### 2. CRIA POLICIES SIMPLES
- **Posts**: Ver posts da rede | Criar | Deletar próprios
- **Likes**: Ver curtidas da rede | Curtir | Remover próprias
- **Comments**: Ver comentários da rede | Comentar | Deletar próprios
- **Check-ins**: Ver da rede | Criar (trigger controla 1 por dia)

---

## 🔒 REGRAS CLARAS:

### ✅ O QUE FUNCIONA:
1. **Apenas alunos convidados** (mesma rede de indicações)
2. **Todos podem postar** (foto ou texto)
3. **Todos podem curtir** posts da rede
4. **Todos podem comentar** em posts da rede
5. **Cada um deleta** apenas próprio conteúdo
6. **Check-in**: 1 por dia (primeiro post marca)
7. **Coaches NÃO veem** NADA (privacidade total)
8. **Comunidade EXCLUSIVA** por convite

### ❌ O QUE NÃO FUNCIONA:
- Ver posts de outras redes (isolamento)
- Coaches acessarem comunidade
- Mais de 1 check-in por dia

---

## 🚀 DEPOIS DE EXECUTAR:

1. Volte em: http://localhost:3001
2. Pressione **F5** (recarregar)
3. Teste:
   - ✅ Criar post com **foto**
   - ✅ Criar post com **texto**
   - ✅ Ver posts dos amigos da rede
   - ✅ Curtir posts
   - ✅ Comentar
   - ✅ Deletar próprios posts
   - ✅ Primeiro post do dia = check-in marcado

---

## ⚠️ IMPORTANTE:

Você já executou 3 SQLs antes. **IGNORE TODOS!**

Execute **APENAS** este:
- ✅ **`CORRIGIR-POLICIES-FINAL.sql`**

Ele vai limpar tudo e recriar do zero, de forma SIMPLES.

---

## 📝 CHECKLIST:

- [ ] Executei o SQL no Supabase
- [ ] Recarreguei a página (F5)
- [ ] Consigo criar posts
- [ ] Consigo ver posts dos amigos
- [ ] Consigo curtir/comentar
- [ ] Check-in marcou no primeiro post

---

Qualquer erro, me envie o log do console (F12)! 🚀
