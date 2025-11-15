# 🔧 Instruções: Correção do Modal de Primeiro Acesso

## Problema
O modal de primeiro acesso estava aparecendo para alunos antigos que já usavam o sistema.

## Solução Implementada

### 1. Script SQL (Execute no Supabase)

Abra o Supabase SQL Editor e execute o script:

```
supabase/fix-first-access-old-students.sql
```

Este script irá:
- Marcar todos os alunos antigos (criados antes de 26/10/2025) como tendo completado o primeiro acesso
- Prevenir que o modal apareça para eles

### 2. Lógica de Dupla Verificação

O sistema agora verifica DUAS condições antes de mostrar o modal:

1. **`first_access_completed = false`** (aluno não completou primeiro acesso)
2. **`photos.length = 0`** (aluno não tem fotos antigas)

Se o aluno tem fotos antigas, o modal NÃO aparece, mesmo que `first_access_completed` esteja false.

## Como Testar

1. Execute o script SQL no Supabase
2. Faça login com uma conta antiga
3. O modal NÃO deve aparecer
4. Crie um novo aluno e aprove
5. O modal DEVE aparecer no primeiro login

## Quando o Modal Aparece?

O modal de primeiro acesso só aparece para:

✅ Alunos novos (sem fotos antigas)
✅ Que ainda não completaram o primeiro acesso
✅ Que foram aprovados pelo coach

❌ Não aparece para alunos antigos (com fotos existentes)

## Fluxo Correto

1. **Aluno Novo:**
   - Cadastra → aguarda aprovação
   - Coach aprova → gera código
   - Coach confirma pagamento → ativa código
   - Aluno faz primeiro login → **MODAL APARECE**
   - Insere código → faz upload de 3 fotos
   - Acesso liberado

2. **Aluno Antigo:**
   - Já tem fotos no sistema
   - Já usava antes do sistema de primeiro acesso
   - **MODAL NÃO APARECE**
   - Acesso direto ao dashboard
