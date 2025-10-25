'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLoading } from '@/components/providers/LoadingProvider';

export default function CadastroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { showLoading, hideLoading } = useLoading();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade para continuar');
      return;
    }

    setLoading(true);
    setError(null);
    showLoading('Criando sua conta...');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess(true);
        showLoading('Conta criada! Redirecionando...');
        setTimeout(() => {
          hideLoading();
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
      hideLoading();
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-center text-gray-600 text-lg font-medium">Criar nova conta</p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold text-center mb-2">Conta criada com sucesso!</p>
            <p className="text-sm text-center">
              Seu cadastro está aguardando aprovação do coach.
              Você receberá acesso assim que for aprovado.
            </p>
            <p className="text-xs text-center mt-2 text-gray-600">Redirecionando para login...</p>
          </div>
        ) : (
          <form onSubmit={handleCadastro} className="mt-8 space-y-6">
            {error && (
              <div className="bg-primary-500/10 border border-primary-500 text-primary-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Seu nome"
                />
              </div>

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
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>
            </div>

            {/* Checkbox de aceite de termos */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                Li e aceito os{' '}
                <Link
                  href="/termos-de-uso"
                  target="_blank"
                  className="text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  Termos de Uso
                </Link>
                {' '}e a{' '}
                <Link
                  href="/politica-de-privacidade"
                  target="_blank"
                  className="text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Já tem uma conta? Faça login
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
        )}
      </div>
    </div>
  );
}
