# 🔧 Correção: Erro de Upload de Fotos no Primeiro Acesso

## 🐛 Problema
Erro ao fazer upload das 3 fotos iniciais:
```
StorageApiError: new row violates row-level security policy
```

## 🎯 Causa
As políticas RLS (Row Level Security) do **Supabase Storage** não estavam configuradas para permitir que alunos façam upload de fotos na pasta `first-access/{aluno_id}/`.

## ✅ Solução

### 1. Execute o Script SQL no Supabase

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo do arquivo:
   ```
   supabase/fix-storage-rls-first-access.sql
   ```
5. Clique em **Run** para executar

**⚠️ IMPORTANTE:** O script remove TODAS as políticas antigas do Storage antes de criar as novas. Isso garante que não haja conflitos.

### 2. O que o script faz?

O script cria 4 políticas RLS para o bucket `progress-photos`:

#### ✅ Política de Upload (INSERT)
- Alunos podem fazer upload **apenas em suas próprias pastas**:
  - `first-access/{seu_id}/` ✅
  - `weekly-photos/{seu_id}/` ✅
  - `first-access/{outro_aluno_id}/` ❌ (bloqueado)

#### ✅ Política de Leitura (SELECT)
- Alunos veem **apenas suas próprias fotos**
- Coaches veem **todas as fotos** de todos os alunos

#### ✅ Política de Atualização (UPDATE)
- Usuários podem atualizar metadados de suas fotos
- Coaches podem atualizar qualquer foto

#### ✅ Política de Deleção (DELETE)
- **Apenas coaches** podem deletar fotos
- Alunos **não podem** deletar fotos

## 🧪 Como Testar

1. Execute o script SQL acima
2. Faça login como um aluno novo (ou limpe o `first_access_completed`)
3. Tente fazer upload das 3 fotos no modal de primeiro acesso
4. Deve funcionar sem erros ✅

## 📋 Checklist de Verificação

Após executar o script, você pode verificar as políticas criadas com:

```sql
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

Deve retornar 4 políticas:
- ✅ `Alunos podem fazer upload de suas fotos` (INSERT)
- ✅ `Alunos podem ver suas próprias fotos` (SELECT)
- ✅ `Usuários podem atualizar metadados de suas fotos` (UPDATE)
- ✅ `Coaches podem deletar fotos` (DELETE)

## 🚀 Estrutura de Pastas no Storage

```
progress-photos/
├── first-access/
│   ├── {aluno_1_id}/
│   │   ├── front_timestamp.jpg
│   │   ├── side_timestamp.jpg
│   │   └── back_timestamp.jpg
│   ├── {aluno_2_id}/
│   │   └── ...
│   └── ...
└── weekly-photos/
    ├── {aluno_1_id}/
    │   ├── week_1_front.jpg
    │   └── ...
    └── ...
```

## ⚠️ Importante

- O bucket `progress-photos` deve existir no Supabase Storage
- O bucket deve ser **público** para permitir visualização via URL
- As pastas são criadas automaticamente no primeiro upload

## 🔄 Se o erro persistir

1. Verifique se o bucket existe:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'progress-photos';
   ```

2. Verifique se o bucket é público:
   ```sql
   UPDATE storage.buckets
   SET public = true
   WHERE id = 'progress-photos';
   ```

3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Faça logout e login novamente

---

✅ **Após executar o script, o upload de fotos deve funcionar perfeitamente!**
