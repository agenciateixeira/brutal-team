# 🚨 EXECUTE ESTES 2 SQLs AGORA - ORDEM CORRETA

## ❌ PROBLEMA:

- Erro 400 ao postar
- Erro "member_id is ambiguous"
- Amigos da rede não aparecem
- Posts não funcionam

---

## ✅ SOLUÇÃO (2 SQLs nesta ordem):

### **1º SQL**: `CORRIGIR-FUNCAO-REDE-V3-FINAL.sql`
- Corrige função get_community_network
- Remove ambiguidade de member_id
- Recria view community_stats

### **2º SQL**: `CORRIGIR-POLICIES-FINAL.sql`
- Policies simples e diretas
- Baseadas na função corrigida

---

## 📋 PASSO A PASSO:

### 1. Acesse Supabase
- https://supabase.com
- SQL Editor

### 2. Execute o 1º SQL
1. New query
2. Abra: **`CORRIGIR-FUNCAO-REDE-V3-FINAL.sql`**
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Run ✅
6. Aguarde sucesso

### 3. Execute o 2º SQL
1. New query (nova!)
2. Abra: **`CORRIGIR-POLICIES-FINAL.sql`**
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Run ✅
6. Aguarde sucesso

### 4. Teste
1. Volte em http://localhost:3001
2. F5 (recarregar)
3. Teste postar foto/texto
4. Veja se amigos aparecem
5. Teste curtir/comentar

---

## 🎯 DEPOIS DE EXECUTAR:

✅ Função de rede funcionará corretamente
✅ Você verá seus amigos indicados
✅ Eles verão você
✅ Todos da mesma rede se veem
✅ Posts funcionam (foto e texto)
✅ Curtidas e comentários funcionam
✅ Check-in: 1 por dia (automático)
🔒 Coaches NÃO veem nada

---

## ⚠️ IMPORTANTE:

**IGNORE todos os outros SQLs anteriores!**

Execute **APENAS ESTES 2**, nesta ordem:
1. CORRIGIR-FUNCAO-REDE-V3-FINAL.sql
2. CORRIGIR-POLICIES-FINAL.sql

---

Qualquer erro, copie e me envie! 🚀
