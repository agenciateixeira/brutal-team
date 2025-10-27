# 📋 Instruções para Configuração do Supabase

## ⚠️ IMPORTANTE - Execute estes scripts na ordem:

### 1️⃣ PRIMEIRO - Corrigir Sistema de Cadastro
**Arquivo:** `supabase/EXECUTE-ESTE-fix-signup-completo.sql`

Este script vai:
- ✅ Corrigir o trigger de signup para capturar o `full_name`
- ✅ Configurar novos alunos com `approved = false` automaticamente
- ✅ Migrar usuários existentes de `auth.users` para `profiles`
- ✅ Exibir relatório com estatísticas

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole TODO o conteúdo do arquivo
4. Clique em "Run"
5. Verifique o relatório final que aparecerá

---

### 2️⃣ SEGUNDO (OPCIONAL) - Criar Tabela de Resumos Semanais
**Arquivo:** `supabase/create-weekly-updates-table.sql`

Este script cria a tabela para os alunos enviarem resumos semanais.

**Como executar:**
1. No Supabase SQL Editor
2. Cole o conteúdo do arquivo
3. Clique em "Run"

---

## 🔍 Como Testar o Fluxo Completo

### Teste 1: Cadastro de Novo Aluno
1. Acesse `/cadastro`
2. Preencha os dados e crie uma conta
3. Verifique se o usuário aparece em `auth.users` E em `profiles`
4. Confirme que `approved = false`

### Teste 2: Aprovação pelo Coach
1. Faça login como coach
2. Vá para `/coach/dashboard`
3. Verifique se o aluno aparece em "Cadastros Pendentes"
4. Aprove o aluno configurando pagamento
5. Aluno deve aparecer em "Novos Alunos - Aguardando Dieta/Treino"

### Teste 3: Configurar Dieta e Treino
1. Na seção "Novos Alunos", clique em "Configurar Dieta e Treino"
2. Você será levado para a página de detalhes do aluno
3. Na aba "Dieta", crie uma nova dieta e ative-a
4. Na aba "Treino", crie um novo treino e ative-o
5. Volte ao dashboard
6. Aluno deve aparecer automaticamente em "Meus Alunos" (lista principal)

---

## 🐛 Problemas Comuns

### Aluno não aparece em "Cadastros Pendentes"
- Execute o script 1️⃣ (`EXECUTE-ESTE-fix-signup-completo.sql`)
- Verifique se o trigger foi criado corretamente
- Crie um novo aluno para testar

### Aluno não move para lista principal após criar dieta/treino
- Verifique se AMBOS (dieta E treino) estão **ativos**
- O aluno só move quando tiver os dois ativos
- Recarregue a página do dashboard

### Coach não consegue criar dieta/treino
- Verifique as políticas RLS nas tabelas `dietas` e `treinos`
- Certifique-se de que o usuário logado tem `role = 'coach'`

---

## 📊 Verificações no Supabase

### Verificar Trigger
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### Verificar Usuários sem Perfil
```sql
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### Verificar Alunos Pendentes
```sql
SELECT * FROM profiles
WHERE role = 'aluno' AND approved = false;
```

### Verificar Dietas e Treinos Ativos
```sql
-- Alunos com dieta ativa
SELECT p.full_name, p.email, d.title
FROM profiles p
JOIN dietas d ON d.aluno_id = p.id AND d.active = true
WHERE p.role = 'aluno';

-- Alunos com treino ativo
SELECT p.full_name, p.email, t.title
FROM profiles p
JOIN treinos t ON t.aluno_id = p.id AND t.active = true
WHERE p.role = 'aluno';
```

---

## ✅ Checklist de Configuração

- [ ] Script 1️⃣ executado (`fix-signup-completo.sql`)
- [ ] Trigger criado e funcionando
- [ ] Usuários existentes migrados
- [ ] Teste de cadastro realizado
- [ ] Teste de aprovação realizado
- [ ] Teste de criação de dieta realizado
- [ ] Teste de criação de treino realizado
- [ ] Aluno moveu para lista principal

---

## 🔄 Como Funciona o Fluxo Completo

```
1. CADASTRO
   ↓
   Usuário cria conta em /cadastro
   ↓
   Trigger cria perfil com approved=false
   ↓

2. APROVAÇÃO
   ↓
   Coach vê em "Cadastros Pendentes"
   ↓
   Coach aprova e configura pagamento
   ↓
   Aluno vai para "Novos Alunos"
   ↓

3. CONFIGURAÇÃO
   ↓
   Coach cria e ativa DIETA
   ↓
   Coach cria e ativa TREINO
   ↓

4. ATIVO
   ↓
   Aluno aparece em "Meus Alunos"
   ↓
   Sistema completo funcionando! 🎉
```

---

## 🆘 Suporte

Se algo não funcionar:
1. Verifique os logs no Supabase Dashboard
2. Execute as queries de verificação acima
3. Certifique-se de que todos os scripts foram executados na ordem
4. Verifique se as dietas e treinos estão marcados como `active = true`
