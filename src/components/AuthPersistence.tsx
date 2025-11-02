'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Componente responsável por manter a sessão do usuário persistida
 * mesmo após fechar o navegador/aplicativo.
 *
 * Funcionalidades:
 * - Persiste sessão no localStorage
 * - Renova token automaticamente antes de expirar
 * - Detecta mudanças de sessão em outras abas
 * - Mantém usuário logado como redes sociais
 */
export default function AuthPersistence() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Verificar se já existe sessão ao carregar
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('✅ Sessão ativa:', session.user.email);
        console.log('🔐 Token expira em:', new Date(session.expires_at! * 1000).toLocaleString('pt-BR'));
      } else {
        console.log('❌ Nenhuma sessão ativa');
      }
    };

    checkSession();

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event);

      if (event === 'SIGNED_IN') {
        console.log('✅ Usuário logado:', session?.user.email);
      }

      if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário deslogado');
        // Limpar dados locais
        localStorage.removeItem('brutal-team-auth');
        // Redirecionar para login
        router.push('/login');
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token renovado automaticamente');
        console.log('🔐 Nova expiração:', new Date(session!.expires_at! * 1000).toLocaleString('pt-BR'));
        // Não fazer refresh aqui - token renova em background sem precisar recarregar
      }

      if (event === 'USER_UPDATED') {
        console.log('👤 Dados do usuário atualizados');
      }

      // Refresh da página APENAS quando usuário faz login (não em token refresh automático)
      if (event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    // Renovar token a cada 50 minutos (token expira em 1 hora)
    // Isso garante que o token seja renovado antes de expirar
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session && !error) {
        // Verificar se o token vai expirar nos próximos 10 minutos
        const expiresAt = session.expires_at! * 1000;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;

        if (expiresAt - now < tenMinutes) {
          console.log('⏰ Token próximo de expirar, renovando...');
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('❌ Erro ao renovar token:', refreshError);
          } else {
            console.log('✅ Token renovado com sucesso');
          }
        }
      }
    }, 50 * 60 * 1000); // 50 minutos

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [supabase, router]);

  return null; // Componente não renderiza nada
}
