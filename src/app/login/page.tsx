'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLoading } from '@/components/providers/LoadingProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { showLoading, hideLoading } = useLoading();

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('✅ Sessão ativa detectada, redirecionando...');
          showLoading('Carregando sua conta...', 3000);

          // Buscar o perfil do usuário para saber o role
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .filter('id', 'eq', session.user.id);

          if (profileError || !profiles || profiles.length === 0) {
            console.error('❌ Erro ao buscar perfil:', profileError);
            setChecking(false);
            hideLoading();
            return;
          }

          const profile = profiles[0];

          // Redirecionar baseado no role
          if ('role' in profile && profile.role === 'coach') {
            router.push('/coach/dashboard');
          } else {
            router.push('/aluno/dashboard');
          }
        } else {
          console.log('❌ Nenhuma sessão ativa');
          setChecking(false);
        }
      } catch (err) {
        console.error('❌ Erro ao verificar sessão:', err);
        setChecking(false);
      }
    };

    checkSession();
  }, [supabase, router, showLoading, hideLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    showLoading('Entrando...', 3000); // 3 segundos para login

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Buscar o perfil do usuário para saber o role
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .filter('id', 'eq', authData.user.id);

      if (profileError || !profiles || profiles.length === 0) throw new Error('Perfil não encontrado');

      const profile = profiles[0];

      // Redirecionar baseado no role
      showLoading('Preparando seu dashboard...', 3000);
      if ('role' in profile && profile.role === 'coach') {
        router.push('/coach/dashboard');
      } else {
        router.push('/aluno/dashboard');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      hideLoading();
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading enquanto verifica sessão
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-48 h-48">
            <Image
              src="/logo.png"
              alt="Brutal Team"
              fill
              className="object-contain animate-pulse"
              priority
            />
          </div>
          <p className="text-gray-600 text-lg font-medium">Verificando conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-4">
            <Image
              src="/logo.png"
              alt="Brutal Team"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-center text-gray-600 text-lg font-medium">Consultoria Fitness</p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="bg-primary-500/10 border border-primary-500 text-primary-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
            <Link href="/recuperar-senha" className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Esqueci minha senha
            </Link>
            <Link href="/cadastro" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>

          {/* Link sutil para cadastro de coach */}
          <div className="text-center pt-2">
            <Link href="/cadastro-coach" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Sou profissional
            </Link>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-gray-500">
              <Link href="/termos-de-uso" className="hover:text-primary-600 transition-colors">
                Termos de Uso
              </Link>
              <span className="hidden sm:inline">•</span>
              <Link href="/politica-de-privacidade" className="hover:text-primary-600 transition-colors">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
