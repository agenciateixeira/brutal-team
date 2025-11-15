# 🔍 Verificar Price IDs no Stripe

## Erro atual:
```
No such price: 'price_1STLLJFNseQuOFRPthiRUcq7'
```

## Como verificar se os Price IDs estão corretos:

### 1. Acesse o Stripe Dashboard
https://dashboard.stripe.com/test/products (**TEST**)
https://dashboard.stripe.com/products (**LIVE**)

### 2. Verifique qual modo você está usando:
- Sua chave: `sk_live_...` = **MODO LIVE** ✅
- Os Products começam com `prod_TQ...` = parecem ser LIVE

### 3. Para cada produto, clique nele e copie o Price ID:

**Starter (R$ 139):**
- Product ID: prod_TQBiK9gw1XBAcC
- Price ID: `price_1...` ← COPIE ESTE

**Pro (R$ 269):**
- Product ID: prod_TQBqwGhm2JaJEv
- Price ID: `price_1...` ← COPIE ESTE

**Empresarial (R$ 997):**
- Product ID: prod_TQBtqGXjRBZ8Dg
- Price ID: `price_1...` ← COPIE ESTE

**Personalizado (R$ 29,90):**
- Product ID: prod_TQByvqHCvch9HV
- Price ID: `price_1...` ← COPIE ESTE

---

## ⚠️ IMPORTANTE:

O Price ID que você me passou pode estar em **TEST MODE** e não **LIVE MODE**.

Confirme que você está vendo os produtos em:
https://dashboard.stripe.com/products (SEM /test/ na URL)

Se tiver o toggle "Test mode" no canto superior direito, desative!

---

## 🔧 Solução rápida:

Acesse cada produto em LIVE MODE e me envie os 4 Price IDs novamente, um por um.
