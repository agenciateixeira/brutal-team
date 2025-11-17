import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Cria um client Supabase usando a Service Role key para páginas/rotas administrativas.
 * Pode retornar null caso as variáveis não estejam configuradas.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
