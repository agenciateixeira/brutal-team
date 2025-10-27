# 🌐 Configurar Subdomínio: questionario.brutalteam.blog.br

Este guia te ensina a configurar o subdomínio `questionario.brutalteam.blog.br` para apontar diretamente para a página de questionário.

---

## 📋 Passo a Passo Completo

### 1️⃣ Configurar DNS (Provedor do Domínio)

Acesse o painel do seu provedor de domínio (Registro.br, GoDaddy, Hostinger, etc.) e adicione um registro CNAME:

**Tipo**: `CNAME`
**Nome/Host**: `questionario`
**Destino/Value**: `cname.vercel-dns.com`
**TTL**: `3600` (1 hora) ou deixe automático

#### Exemplo no painel DNS:

```
Tipo    | Nome         | Destino
--------|--------------|----------------------
CNAME   | questionario | cname.vercel-dns.com
```

⏳ **Aguarde**: A propagação DNS pode levar de 5 minutos até 48 horas (geralmente 15-30 minutos).

---

### 2️⃣ Adicionar Domínio Customizado no Vercel

#### Opção A: Via Dashboard Vercel

1. Acesse [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto **brutal-team**
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite: `questionario.brutalteam.blog.br`
6. Clique em **Add**

O Vercel vai detectar automaticamente o CNAME configurado.

#### Opção B: Via CLI (mais rápido)

```bash
cd C:\Users\guilh\Documents\brutal-team
vercel domains add questionario.brutalteam.blog.br
```

---

### 3️⃣ Verificar Middleware (Já Configurado ✅)

O arquivo `src/middleware.ts` já foi criado e faz o seguinte:

- Detecta quando o usuário acessa `questionario.brutalteam.blog.br`
- Automaticamente reescreve a URL para `/questionario`
- O usuário vê `questionario.brutalteam.blog.br` na barra de endereço
- Mas internamente o Next.js serve a página `/questionario`

**Nenhuma ação necessária aqui!** ✅

---

### 4️⃣ Fazer Deploy das Alterações

```bash
cd C:\Users\guilh\Documents\brutal-team
git add .
git commit -m "feat: adicionar middleware para subdomínio questionario"
git push origin main
```

O Vercel vai fazer o deploy automaticamente. 🚀

---

## 🧪 Como Testar

### Durante a Propagação DNS (antes de estar pronto):

1. Abra o CMD/PowerShell
2. Execute:
   ```bash
   nslookup questionario.brutalteam.blog.br
   ```
3. Se retornar um endereço IP do Vercel (ex: `76.76.21.21`), está funcionando!

### Após a Propagação (quando estiver pronto):

1. Acesse: `https://questionario.brutalteam.blog.br`
2. Deve abrir automaticamente a página do questionário
3. A URL permanece como `questionario.brutalteam.blog.br` (não muda para `/questionario`)

---

## 🎯 Como Funciona

```
Usuário digita:
https://questionario.brutalteam.blog.br
           ⬇
     DNS resolve para Vercel
           ⬇
   Vercel recebe a requisição
           ⬇
  Middleware detecta o hostname
           ⬇
  Reescreve internamente para /questionario
           ⬇
    Página renderizada
           ⬇
URL permanece: questionario.brutalteam.blog.br
```

---

## 🔒 SSL/HTTPS Automático

O Vercel gera automaticamente um certificado SSL gratuito via Let's Encrypt. Aguarde alguns minutos após adicionar o domínio.

✅ Seu subdomínio será automaticamente acessível via HTTPS!

---

## ⚠️ Troubleshooting

### Problema: DNS não resolve

**Solução**: Aguarde mais tempo (até 48h em casos raros) ou force a limpeza do cache DNS:

```bash
# Windows
ipconfig /flushdns

# Mac/Linux
sudo dscacheutil -flushcache
```

### Problema: Vercel não reconhece o domínio

**Solução**: Verifique se o CNAME aponta para `cname.vercel-dns.com` (não para um IP específico).

### Problema: Página 404 ao acessar o subdomínio

**Solução**: Verifique se o middleware foi commitado e o deploy foi feito:

```bash
git status
git log --oneline -1
```

---

## 📊 Estrutura Final

Após configurado:

| URL                                    | Destino Interno    |
|----------------------------------------|-------------------|
| `brutalteam.blog.br`                   | `/` (homepage)    |
| `app.brutalteam.blog.br`               | `/` (app atual)   |
| `questionario.brutalteam.blog.br`      | `/questionario`   |

---

## ✅ Checklist

- [ ] Adicionar registro CNAME no provedor DNS
- [ ] Adicionar domínio no Vercel (via dashboard ou CLI)
- [ ] Fazer deploy do middleware (`git push`)
- [ ] Aguardar propagação DNS (15-30 min)
- [ ] Testar acesso: `https://questionario.brutalteam.blog.br`

---

**🎉 Pronto! Seu subdomínio estará funcionando perfeitamente!**
