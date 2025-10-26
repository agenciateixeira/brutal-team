# Erros de Console Resolvidos

## 1. ✅ Erro: "column 'link'/'related_id'/'icon' of relation 'notifications' does not exist"

### Problema
Ao salvar uma dieta, o trigger de notificação tentava inserir colunas que não existiam na tabela:
- `link` - URL para onde a notificação leva
- `related_id` - ID do registro relacionado (dieta, treino, etc)
- `icon` - Nome do ícone a exibir

### Solução
Execute o SQL: `supabase/fix-notifications-table.sql`

Ele adiciona todas as 3 colunas:
```sql
ALTER TABLE notifications ADD COLUMN link VARCHAR(500);
ALTER TABLE notifications ADD COLUMN related_id UUID;
ALTER TABLE notifications ADD COLUMN icon VARCHAR(50);
```

### Status
✅ **Resolvido** - SQL completo criado, precisa executar no Supabase

---

## 2. ✅ Erro: "POST https://news-cmry0k7yy.../api/send-email.js net::ERR_FAILED"

### Problema
Erros de CORS relacionados a requisições para um domínio `news-cmry0k7yy-guilhermes-projects...`

### Causa
Este erro **NÃO é do projeto Brutal Team**. É de:
- Uma extensão do Chrome/Firefox
- Outro projeto rodando em paralelo (projeto "news")
- Script injetado por alguma ferramenta de desenvolvimento

### Como Verificar
1. Abra DevTools → Network
2. Procure por `send-email.js`
3. Veja o "Initiator" (quem fez a requisição)

### Como Resolver

#### Opção 1: Desabilitar extensões temporariamente
1. Abra o site em modo anônimo
2. Se o erro sumir, é uma extensão

#### Opção 2: Limpar cache e cookies
```bash
# Chrome DevTools
Ctrl + Shift + Delete → Limpar tudo
```

#### Opção 3: Verificar Service Workers
1. DevTools → Application → Service Workers
2. "Unregister" qualquer service worker não reconhecido

#### Opção 4: Bloquear domínio específico
Adicione ao `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "connect-src 'self' https://*.supabase.co; frame-src 'none';"
        }
      ]
    }
  ];
}
```

### Status
⚠️ **Não é bug do projeto** - Verifique extensões/outros projetos

---

## 3. ✅ Toasts não aparecendo ou sem animação

### Problema
Componente Toast usando animação incorreta ou não visível

### Solução
1. Corrigida animação: `animate-slideIn` (entrar da direita)
2. Adicionada animação de saída: `animate-fadeOut`
3. z-index aumentado para 9999
4. Melhorado contraste de cores

### Melhorias
- Animação suave de entrada e saída
- Botão fechar mais visível
- Cores mais contrastantes
- Shadow mais forte

### Status
✅ **Resolvido** - Toast melhorado e testado

---

## 4. ⚠️ Realtime não funciona

### Possível Causa
O SQL `enable-realtime.sql` não foi executado no Supabase

### Como Verificar
```sql
-- No Supabase SQL Editor:
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Deve retornar:
- messages
- meal_tracking
- workout_tracking
- protocol_tracking

### Solução
Se não aparecer, execute: `supabase/enable-realtime.sql`

### Status
⚠️ **Verificar manualmente** - Depende do Supabase

---

## Debug no Console

Para debug, abra o console e procure por:

### Logs de Sucesso ✅
```
🍎 Meal tracking changed: {...}
💪 Workout tracking changed: {...}
📡 Subscription status: SUBSCRIBED
```

### Logs de Erro ❌
```
❌ Erro ao salvar: ...
⚠️ Subscription status: CLOSED
⚠️ Subscription status: TIMED_OUT
```

---

## Checklist Final

Antes de relatar um bug, verifique:

- [ ] SQL `fix-notifications-table.sql` executado?
- [ ] SQL `fix-dietas-table.sql` executado?
- [ ] SQL `enable-realtime.sql` executado?
- [ ] Cache do browser limpo?
- [ ] Testado em modo anônimo?
- [ ] Console mostra logs de debug?
- [ ] Erro persiste em outro navegador?

---

## Quando Reportar Bug

Reporte apenas se:
1. Erro acontece em modo anônimo (sem extensões)
2. Cache foi limpo
3. Todos os SQLs foram executados
4. Erro é reproduzível

### Como Reportar
1. Screenshot do erro no console
2. Passos para reproduzir
3. Navegador e versão
4. Desktop ou Mobile?
