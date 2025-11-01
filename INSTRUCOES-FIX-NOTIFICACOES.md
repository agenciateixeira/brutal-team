# 🔧 FIX: Sistema de Notificações - Brutal Team

## 📋 Problema Identificado

O sistema de notificações estava **parcialmente implementado**. O código tentava usar a coluna `viewed_by_aluno` nas tabelas `dietas`, `treinos` e `protocolos_hormonais`, mas essa coluna **não existia no banco de dados**.

### Sintomas do Problema
- ❌ Notificações não apareciam no dashboard do aluno após o coach atualizar dieta/treino/protocolo
- ❌ O badge de "Nova Atualização" não era exibido
- ❌ Sistema tentava acessar campo inexistente causando erros silenciosos

---

## ✅ Solução Implementada

A correção foi feita em **2 níveis**:

### 1. **Banco de Dados (SQL)**
- ✅ Adicionar coluna `viewed_by_aluno` nas 3 tabelas
- ✅ Atualizar triggers para resetar `viewed_by_aluno` automaticamente

### 2. **Código Frontend (TypeScript)**
- ✅ Atualizar `DietaManager.tsx` para definir `viewed_by_aluno: false`
- ✅ Atualizar `TreinoManager.tsx` para definir `viewed_by_aluno: false`
- ✅ Atualizar `ProtocoloManager.tsx` para definir `viewed_by_aluno: false`

---

## 🚀 Passos para Aplicar o Fix

### **Passo 1: Executar SQL no Supabase** (OBRIGATÓRIO)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute **NA ORDEM**:

#### **1.1 - Criar as colunas `viewed_by_aluno`**
```bash
Arquivo: supabase/fix-add-viewed-by-aluno-columns.sql
```
Este arquivo adiciona a coluna `viewed_by_aluno` nas 3 tabelas.

#### **1.2 - Atualizar os triggers**
```bash
Arquivo: supabase/fix-update-notification-triggers.sql
```
Este arquivo atualiza os triggers para resetar `viewed_by_aluno` automaticamente quando:
- Uma dieta/treino/protocolo é **ativado**
- Uma dieta/treino/protocolo **ativo é atualizado** (conteúdo ou título mudou)

---

### **Passo 2: Deploy do Código** (Já está pronto!)

Os seguintes arquivos **já foram atualizados** no código:
- ✅ `src/components/coach/DietaManager.tsx`
- ✅ `src/components/coach/TreinoManager.tsx`
- ✅ `src/components/coach/ProtocoloManager.tsx`

Basta fazer o **commit e deploy**:

```bash
git add .
git commit -m "Fix: Sistema de notificações - adiciona viewed_by_aluno"
git push origin main
```

---

## 🔄 Como Funciona Agora

### **Quando o Coach CRIA uma nova dieta/treino/protocolo:**
1. Coach preenche o formulário e salva
2. Sistema insere no banco com `viewed_by_aluno: false`
3. **Se estiver marcado como "ativo":**
   - Trigger SQL cria uma notificação na tabela `notifications`
   - Aluno vê o badge no dashboard 🔴

### **Quando o Coach ATIVA uma dieta/treino/protocolo existente:**
1. Coach clica no botão "Ativar"
2. Sistema atualiza com `active: true` e `viewed_by_aluno: false`
3. Trigger SQL:
   - Cria notificação na tabela `notifications`
   - Reseta `viewed_by_aluno` para `false`
4. Aluno vê o badge no dashboard 🔴

### **Quando o Coach ATUALIZA uma dieta/treino/protocolo já ativo:**
1. Coach edita o conteúdo ou título
2. Trigger SQL detecta a mudança
3. Reseta `viewed_by_aluno: false` automaticamente
4. Aluno vê o badge no dashboard 🔴

### **Quando o Aluno ACESSA a página:**
1. Aluno clica em "Ver Dieta" / "Ver Treino" / "Ver Protocolo"
2. Sistema marca `viewed_by_aluno: true`
3. Badge desaparece do dashboard ✅

---

## 📊 Arquivos Criados/Modificados

### **Arquivos SQL Criados:**
- ✅ `supabase/fix-add-viewed-by-aluno-columns.sql`
- ✅ `supabase/fix-update-notification-triggers.sql`

### **Arquivos TypeScript Modificados:**
- ✅ `src/components/coach/DietaManager.tsx` (linhas 106, 142)
- ✅ `src/components/coach/TreinoManager.tsx` (linhas 119, 154)
- ✅ `src/components/coach/ProtocoloManager.tsx` (linhas 95, 129)

---

## ✅ Checklist de Verificação

Após aplicar o fix:

- [ ] Executar `fix-add-viewed-by-aluno-columns.sql` no Supabase
- [ ] Executar `fix-update-notification-triggers.sql` no Supabase
- [ ] Fazer commit e push do código
- [ ] Fazer deploy da aplicação
- [ ] **TESTAR:**
  - [ ] Coach cria nova dieta e ativa
  - [ ] Aluno vê notificação no dashboard
  - [ ] Aluno clica em "Ver Dieta"
  - [ ] Notificação desaparece
  - [ ] Repetir teste para treino e protocolo

---

## 🐛 Se Algo Der Errado

### **Erro: "column viewed_by_aluno does not exist"**
- ✅ Execute o SQL: `supabase/fix-add-viewed-by-aluno-columns.sql`

### **Notificação não aparece mesmo após coach ativar**
- ✅ Execute o SQL: `supabase/fix-update-notification-triggers.sql`
- ✅ Verifique se a tabela `notifications` existe no banco

### **Notificação não desaparece após aluno acessar**
- ✅ Verifique se o código frontend foi deployado
- ✅ Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📝 Observações Importantes

1. **Ordem de execução dos SQLs é importante!** Execute `fix-add-viewed-by-aluno-columns.sql` ANTES de `fix-update-notification-triggers.sql`

2. **Dados antigos:** Dietas/treinos/protocolos criados ANTES do fix terão `viewed_by_aluno = null`. O sistema trata isso corretamente (considera como não visualizado).

3. **Triggers automáticos:** Agora o sistema reseta `viewed_by_aluno` automaticamente quando houver atualização. O coach NÃO precisa fazer nada manualmente.

4. **Sistema de notificações duplicado:** O sistema tem 2 mecanismos:
   - Tabela `notifications` (para notificações em tempo real)
   - Campo `viewed_by_aluno` (para badges no dashboard)

   Ambos funcionam juntos para garantir que o aluno seja notificado.

---

## 🎉 Resultado Esperado

Após aplicar o fix:

✅ Coach cria/ativa/atualiza dieta → Aluno vê notificação instantaneamente
✅ Badge "Nova Atualização" aparece no dashboard do aluno
✅ Aluno acessa a página → Badge desaparece automaticamente
✅ Funciona para Dieta, Treino e Protocolo

---

**Data do Fix:** 2025-11-01
**Desenvolvido por:** Claude Code Assistant
**Status:** ✅ Pronto para Deploy
