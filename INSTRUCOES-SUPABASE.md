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

### 2️⃣ SEGUNDO - Criar Bucket para Documentos
**Arquivo:** `supabase/create-student-documents-bucket.sql`

Este script vai:
- ✅ Criar bucket `student-documents` para PDFs de dieta/treino
- ✅ Configurar políticas RLS de acesso
- ✅ Limitar uploads a 10MB por arquivo
- ✅ Permitir apenas arquivos PDF

**Como executar:**
1. No Supabase SQL Editor
2. Cole o conteúdo do arquivo
3. Clique em "Run"

---

### 3️⃣ TERCEIRO (OPCIONAL) - Criar Tabela de Resumos Semanais
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

### Teste 3: Upload de Dieta e Treino
1. Na seção "Novos Alunos", clique em "Enviar Dieta (PDF)"
2. Faça upload de um PDF
3. Badge "Dieta OK" deve aparecer
4. Clique em "Enviar Treino (PDF)"
5. Faça upload de um PDF
6. Badge "Treino OK" deve aparecer
7. Aluno move automaticamente para "Meus Alunos" (lista principal)

---

## 🐛 Problemas Comuns

### Aluno não aparece em "Cadastros Pendentes"
- Execute o script 1️⃣ (`EXECUTE-ESTE-fix-signup-completo.sql`)
- Verifique se o trigger foi criado corretamente
- Crie um novo aluno para testar

### Upload de PDF não funciona
- Execute o script 2️⃣ (`create-student-documents-bucket.sql`)
- Verifique se o bucket foi criado em Storage > Buckets
- Confirme que as políticas RLS estão ativas

### Aluno não move para lista principal após upload
- Verifique se AMBOS (dieta E treino) foram enviados
- O aluno só move quando tiver os dois arquivos
- Recarregue a página do dashboard

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

### Verificar Bucket
```sql
SELECT * FROM storage.buckets
WHERE id = 'student-documents';
```

---

## ✅ Checklist de Configuração

- [ ] Script 1️⃣ executado (`fix-signup-completo.sql`)
- [ ] Trigger criado e funcionando
- [ ] Usuários existentes migrados
- [ ] Script 2️⃣ executado (`create-student-documents-bucket.sql`)
- [ ] Bucket criado no Storage
- [ ] Políticas RLS configuradas
- [ ] Teste de cadastro realizado
- [ ] Teste de aprovação realizado
- [ ] Teste de upload realizado

---

## 🆘 Suporte

Se algo não funcionar:
1. Verifique os logs no Supabase Dashboard
2. Execute as queries de verificação acima
3. Certifique-se de que todos os scripts foram executados na ordem
