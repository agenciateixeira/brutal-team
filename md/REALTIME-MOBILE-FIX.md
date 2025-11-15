# Fix: Mensagens em Tempo Real no Mobile

## Problema
As mensagens funcionam em tempo real no desktop mas não no mobile.

## Causas Prováveis

### 1. WebSocket Connection Timeout
Navegadores mobile podem fechar conexões WebSocket quando:
- A tela é bloqueada
- O app vai para background
- Rede muda (WiFi para 4G)

### 2. Service Workers
Service Workers podem não funcionar da mesma forma em mobile

### 3. Heartbeat/Keepalive
Conexões WebSocket em mobile precisam de heartbeat mais frequente

## Soluções

### Solução 1: Configurar Reconnection no Supabase Client

Adicione configurações de reconnection no createClient:

```typescript
// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

export const createClient = () => {
  return createClientComponentClient<Database>({
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
      heartbeatIntervalMs: 15000, // Aumenta para 15s no mobile
      reconnectAfterMs: (tries) => {
        // Reconnect com backoff exponencial
        return Math.min(tries * 1000, 10000);
      },
    },
  });
};
```

### Solução 2: Adicionar Listeners de Visibilidade

Reconectar quando a página volta a ficar visível:

```typescript
// src/components/aluno/MessageList.tsx ou CoachMessageList.tsx

useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Força reconexão quando volta para a página
      supabase.realtime.disconnect();
      setTimeout(() => {
        supabase.realtime.connect();
      }, 100);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [supabase]);
```

### Solução 3: Polling de Fallback

Adicionar polling como fallback quando realtime falhar:

```typescript
useEffect(() => {
  let pollInterval: NodeJS.Timeout;

  // Detecta se está em mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // No mobile, adiciona polling a cada 5 segundos como fallback
    pollInterval = setInterval(() => {
      // Recarrega mensagens
      loadLatestMessages();
    }, 5000);
  }

  return () => {
    if (pollInterval) clearInterval(pollInterval);
  };
}, [isMobile]);
```

### Solução 4: Service Worker para Background Sync

Se quiser notificações mesmo com app em background:

```typescript
// public/sw.js
self.addEventListener('message', (event) => {
  if (event.data.type === 'NEW_MESSAGE') {
    self.registration.showNotification('Nova Mensagem', {
      body: event.data.message,
      icon: '/icon.png',
    });
  }
});
```

## Recomendação

Comece com a **Solução 1 + Solução 2**. São as mais simples e resolvem 90% dos casos.

Se o problema persistir, adicione a Solução 3 como fallback.

## Testando

1. Execute as mudanças
2. Abra o app no mobile
3. Bloqueie a tela por 30 segundos
4. Desbloqueie
5. Envie uma mensagem do desktop
6. Verifique se aparece no mobile

## Debug no Mobile

Para ver logs no mobile:
1. Chrome Android: chrome://inspect
2. Safari iOS: Safari > Develop > [seu iPhone]
3. Ou use `console.log` com toast visual para debug sem DevTools
