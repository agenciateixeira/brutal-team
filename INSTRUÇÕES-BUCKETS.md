# 🪣 Instruções para Criar Buckets no Supabase

## Problema Atual

Você está recebendo o erro: **"Bucket not found"** ao tentar fazer upload de fotos.

## ✅ Solução Passo a Passo

### 1️⃣ Executar SQL para Criar o Bucket

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **+ New Query**
4. Cole o conteúdo do arquivo: `supabase-create-avatars-bucket.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

Você deve ver a mensagem de sucesso! ✅

### 2️⃣ Verificar se o Bucket Foi Criado

1. Vá em **Storage** (menu lateral esquerdo)
2. Você deve ver o bucket **avatars** na lista
3. O bucket deve estar marcado como **Public** ✅

### 3️⃣ Testar o Upload

1. Volte ao seu projeto: `http://localhost:3000`
2. Faça refresh na página (F5 ou Ctrl+R)
3. Vá em **Perfil**
4. Clique no ícone da câmera para fazer upload de uma foto
5. Selecione uma imagem
6. Deve aparecer: **"✅ Foto carregada! Clique em 'Salvar Alterações' para confirmar."**

---

## 🔍 Sobre os Erros de CORS (send-email.js)

Os erros relacionados a `send-email.js` que aparecem no console **NÃO são do seu projeto**.

Possíveis causas:
- ❌ Extensão do navegador fazendo requisições indevidas
- ❌ Script de outro projeto rodando na mesma porta
- ❌ Service Worker antigo em cache

**Como resolver:**
1. Abra o DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Clique em **Unregister** em todos os service workers
4. Vá em **Application** > **Storage**
5. Clique em **Clear site data**
6. Feche e abra o navegador novamente

---

## 📦 Buckets Necessários no Projeto

| Bucket | Usado Para | Status |
|--------|-----------|--------|
| `avatars` | Fotos de perfil dos usuários | ⚠️ Criar agora |
| `progress-photos` | Fotos de progresso dos alunos | ✅ Já existe |

---

## ⚡ Script SQL Completo

Se preferir, aqui está o SQL completo que você precisa executar:

```sql
-- Criar bucket de avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir que usuários autenticados vejam avatares
CREATE POLICY IF NOT EXISTS "Avatars são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: Permitir upload de avatares para usuários autenticados
CREATE POLICY IF NOT EXISTS "Usuários podem fazer upload de avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política: Permitir que usuários atualizem seus próprios avatares
CREATE POLICY IF NOT EXISTS "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars');

-- Política: Permitir que usuários deletem seus próprios avatares
CREATE POLICY IF NOT EXISTS "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());
```

---

## ✅ Depois de Executar

Você poderá:
- ✅ Fazer upload de foto de perfil (até 5MB)
- ✅ Ver preview da foto antes de salvar
- ✅ Alterar a foto quantas vezes quiser
- ✅ A foto será pública e acessível por URL

---

**🚀 Depois de resolver isso, podemos continuar com as próximas features!**
