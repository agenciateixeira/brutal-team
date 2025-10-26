import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

export const createClient = () => {
  return createClientComponentClient<Database>({
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
      // Aumenta heartbeat para mobile (15s ao invés de 30s default)
      heartbeatIntervalMs: 15000,
      // Reconnect com backoff exponencial
      reconnectAfterMs: (tries: number) => {
        // Tenta reconectar mais rápido: 1s, 2s, 4s, 8s, até max 10s
        console.log(`🔄 Reconnecting attempt ${tries}...`);
        return Math.min(tries * 1000, 10000);
      },
    },
  });
};
