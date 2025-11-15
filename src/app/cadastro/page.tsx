'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLoading } from '@/components/providers/LoadingProvider';
import { Gift, Check, X } from 'lucide-react';

export default function CadastroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para convite via token
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { showLoading, hideLoading } = useLoading();

  // Detectar código de indicação ou token de convite da URL
  useEffect(() => {
    const refParam = searchParams.get('ref');
    const tokenParam = searchParams.get('token');

    if (tokenParam) {
      // Prioridade para token de convite
      setInviteToken(tokenParam);
      validateInviteToken(tokenParam);
    } else if (refParam) {
      // Código de indicação como fallback
      setReferralCode(refParam);
      validateReferralCode(refParam);
    }
  }, [searchParams]);

  // Validar código de indicação
  const validateReferralCode = async (code: string) => {
    if (!code || code.trim() === '') {
      setReferralValid(null);
      return;
    }

    setReferralChecking(true);
    setReferralValid(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, referral_code')
        .eq('referral_code', code.trim().toUpperCase())
        .eq('role', 'aluno')
        .single();

      if (error || !data) {
        setReferralValid(false);
      } else {
        setReferralValid(true);
      }
    } catch (err) {
      setReferralValid(false);
    } finally {
      setReferralChecking(false);
    }
  };

  // Validar token de convite
  const validateInviteToken = async (token: string) => {
    if (!token || token.trim() === '') {
      setInviteError('Token inválido');
      return;
    }

    setInviteLoading(true);
    setInviteError('');

    try {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select(`
          id,
          coach_id,
          payment_due_day,
          expires_at,
          used,
          coach:profiles!invite_tokens_coach_id_fkey(
            full_name,
            email
          )
        `)
        .eq('token', token.trim())
        .single();

      if (error || !data) {
        setInviteError('Convite não encontrado');
        return;
      }

      // Verificar se já foi usado
      if (data.used) {
        setInviteError('Este convite já foi utilizado');
        return;
      }

      // Verificar se expirou
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      if (now > expiresAt) {
        setInviteError('Este convite expirou');
        return;
      }

      // Token válido - armazenar dados
      setInviteData(data);
    } catch (err) {
      console.error('Erro ao validar token:', err);
      setInviteError('Erro ao validar convite');
    } finally {
      setInviteLoading(false);
    }
  };

  // Debounce para validação ao digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      if (referralCode) {
        validateReferralCode(referralCode);
      } else {
        setReferralValid(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [referralCode]);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade para continuar');
      return;
    }

    setLoading(true);
    setError(null);
    showLoading('Criando sua conta...', 5000);

    try {
      // Usar API robusta que garante criação do profile
      const response = await fetch('/api/auth/register-aluno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          inviteToken: inviteToken || null,
          referralCode: referralCode || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      setSuccess(true);
      showLoading('Conta criada! Redirecionando...', 3000);
      setTimeout(() => {
        hideLoading();
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error('[Cadastro] Erro:', err);
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

            {/* Card de convite */}
            {inviteLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 text-center">Validando convite...</p>
              </div>
            )}

            {inviteError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 text-center">{inviteError}</p>
              </div>
            )}

            {inviteData && !inviteError && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 mb-1">
                      Convite Válido
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      Você foi convidado por <span className="font-semibold">{inviteData.coach?.full_name}</span>
                    </p>
                    <p className="text-xs text-green-600">
                      Dia de pagamento: {inviteData.payment_due_day}
                    </p>
                  </div>
                </div>
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

              {/* Campo de código de indicação */}
              <div className="pt-2">
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Gift size={16} className="text-primary-600" />
                  Código de Indicação (opcional)
                </label>
                <div className="relative">
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className={`block w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 ${
                      referralValid === true
                        ? 'border-green-500'
                        : referralValid === false
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="BRUTAL-XXXXX"
                    maxLength={13}
                  />
                  {/* Indicador de validação */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {referralChecking && (
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!referralChecking && referralValid === true && (
                      <Check size={20} className="text-green-600" />
                    )}
                    {!referralChecking && referralValid === false && (
                      <X size={20} className="text-red-600" />
                    )}
                  </div>
                </div>
                {/* Mensagens de feedback */}
                {referralValid === true && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check size={14} />
                    Código válido! Você ganhará 10% de desconto
                  </p>
                )}
                {referralValid === false && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X size={14} />
                    Código inválido
                  </p>
                )}
                {!referralCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tem um código de indicação? Ganhe 10% OFF!
                  </p>
                )}
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
