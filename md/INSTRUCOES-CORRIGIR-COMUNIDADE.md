# 🔧 INSTRUÇÕES: Corrigir Comunidade (Likes e Comentários)

## ❌ PROBLEMA IDENTIFICADO

Os **comentários e likes não estão persistindo** porque a **função `get_community_network()`** do Supabase está **incompleta**.

### Por que estava acontecendo?

A função antiga retornava apenas:
- ✅ Você
- ✅ Quem você indicou (descendentes)

Mas **NÃO retornava**:
- ❌ Quem te indicou
- ❌ Outros alunos indicados pela mesma pessoa
- ❌ Toda a árvore de indicações

**Resultado**: Você ficava isolado e não conseguia ver/curtir/comentar posts de **outros da sua rede**.

---

## ✅ SOLUÇÃO

Execute **3 arquivos SQL** no Supabase (nesta ordem):

1. **`CORRIGIR-FUNCAO-REDE-V2.sql`** ← Função de rede + cria policies básicas
2. **`CORRIGIR-POLICIES-REDE-V3.sql`** ← Atualiza policies para permitir próprios posts (NOVA VERSÃO!)
3. **`CORRIGIR-POST-TEXTO.sql`** ← Permite posts sem foto

---

## 📋 PASSO A PASSO

### 1. Acesse o Supabase
- Vá em: https://supabase.com
- Faça login no projeto **brutal-team**

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **"New query"**

### 3. Execute o PRIMEIRO SQL (V2 - ATUALIZADO!)
- Abra o arquivo: **`CORRIGIR-FUNCAO-REDE-V2.sql`**
- Copie **TODO** o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **"Run"** (ou pressione Ctrl+Enter)
- Aguarde a mensagem de sucesso

### 4. Execute o SEGUNDO SQL (V3!)
- Clique em **"New query"** novamente
- Abra o arquivo: **`CORRIGIR-POLICIES-REDE-V3.sql`**
- Copie **TODO** o conteúdo
- Cole no SQL Editor
- Clique em **"Run"**
- Aguarde a mensagem de sucesso

### 5. Execute o TERCEIRO SQL
- Clique em **"New query"** novamente
- Abra o arquivo: **`CORRIGIR-POST-TEXTO.sql`**
- Copie **TODO** o conteúdo
- Cole no SQL Editor
- Clique em **"Run"**
- Aguarde a mensagem de sucesso

### 6. Verifique
- Volte na aplicação (http://localhost:3001)
- Faça **F5** para recarregar
- Teste:
  - ✅ Curtir um post → Deve persistir
  - ✅ Comentar → Deve aparecer e persistir
  - ✅ Atualizar página → Likes e comentários devem continuar lá

---

## 🔍 O QUE O SQL FAZ?

### Remove a função antiga:
- ❌ `get_community_network()` antiga (incompleta)

### Cria função completa:
A nova função faz **2 passos**:

**PASSO 1: Sobe até a raiz**
- Encontra quem te indicou
- Depois quem indicou essa pessoa
- Sobe até chegar na raiz da árvore

**PASSO 2: Desce pegando todos**
- Da raiz, desce pegando TODOS os descendentes
- Isso inclui você + quem te indicou + todos os outros da rede

### Resultado:
- ✅ Você vê posts de **TODA a sua rede de indicações**
- ✅ Pode curtir/comentar **próprios posts** (sempre)
- ✅ Pode curtir/comentar posts de **qualquer pessoa da rede**
- 🔒 **COMUNIDADE EXCLUSIVA**: Sem convite = isolado (só vê próprios posts)
- 🔒 Pessoas de fora da rede **NÃO** veem seus posts

---

## 🎯 RESULTADO ESPERADO

Após executar os 2 SQLs, **TUDO** deve funcionar:

### Próprios Posts:
- ✅ Curtir **seu próprio post** → Funciona (sempre)
- ✅ Comentar **no seu post** → Funciona (sempre)

### Posts da Rede:
- ✅ Ver posts de **toda a sua rede** (quem indicou + outros indicados)
- ✅ Curtir posts da rede → Coração vermelho **instantaneamente**
- ✅ Comentar → Campo inline (mobile) ou modal (desktop)
- ✅ F5 → **Tudo persistido no banco**

### 🔒 Comunidade Exclusiva:
- Sem convite (não indicado) → Isolado (só vê próprios posts)
- Pessoas de fora **NÃO** veem seus posts

---

## 🚨 SE NÃO FUNCIONAR

Se após executar o SQL ainda não funcionar:

1. Abra o **DevTools** do navegador (F12)
2. Vá na aba **Console**
3. Tente curtir/comentar
4. Veja se aparece algum erro vermelho
5. Copie o erro e me envie

Também pode verificar a aba **Network** para ver se as requisições para o Supabase estão retornando erro 403 (Forbidden).

---

## 📝 NOTAS IMPORTANTES

- Esse SQL **não apaga** nenhum dado existente
- Apenas **atualiza as permissões** (policies)
- É **seguro** executar
- Pode executar **várias vezes** sem problema (é idempotente)

---

## ✨ MELHORIAS IMPLEMENTADAS NO CÓDIGO

Além de corrigir as políticas, também melhorei o código:

### CommunityFeed.tsx
- ✅ Likes otimistas (atualiza UI instantaneamente)
- ✅ Campo de comentário inline (mobile)
- ✅ Recarrega dados após comentar
- ✅ Sistema de rollback se houver erro

### PostModal.tsx
- ✅ Likes otimistas no modal
- ✅ Sistema de rollback

---

Qualquer dúvida, me chame! 🚀
