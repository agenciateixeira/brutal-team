import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

// Para Server Components (páginas)
export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  });
};

// Para API Routes
export const createRouteClient = () => {
  return createRouteHandlerClient<Database>({
    cookies,
  });
};
