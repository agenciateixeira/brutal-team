'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLoading } from '@/components/providers/LoadingProvider';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { PLANS } from '@/config/plans';
import KYCForm from '@/components/forms/KYCForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CadastroCoachPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para o fluxo de onboarding completo
  const [step, setStep] = useState<'cadastro' | 'onboarding' | 'plano' | 'pagamento' | 'completo'>('cadastro');
  const [kycError, setKycError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showLoading, hideLoading } = useLoading();

  // Verificar se está em localhost
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Recuperar progresso do localStorage na inicialização
  useEffect(() => {
    const savedProgress = localStorage.getItem('brutal-team-cadastro-coach');
    if (savedProgress) {
      try {
        const { userId: savedUserId, step: savedStep, timestamp } = JSON.parse(savedProgress);

        // Verificar se não expirou (1 hora)
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (now - timestamp < oneHour) {
          console.log('[Cadastro Coach] Recuperando progresso salvo:', { savedUserId, savedStep });
          setUserId(savedUserId);
          setStep(savedStep);
        } else {
          console.log('[Cadastro Coach] Progresso expirado, removendo...');
          localStorage.removeItem('brutal-team-cadastro-coach');
        }
      } catch (err) {
        console.error('[Cadastro Coach] Erro ao recuperar progresso:', err);
        localStorage.removeItem('brutal-team-cadastro-coach');
      }
    }
  }, []);

  // Handler para enviar dados KYC
  const handleKycSubmit = async (kycData: any) => {
    setLoading(true);
    setKycError('');
    showLoading('Enviando dados para verificação...', 10000);

    try {
      console.log('[Cadastro Coach] Enviando dados KYC...');

      const response = await fetch('/api/stripe/submit-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao enviar dados de verificação');
      }

      console.log('[Cadastro Coach] KYC enviado com sucesso:', data);
      hideLoading();

      // Mostrar mensagem de sucesso e avançar para próximo passo
      showLoading('Dados enviados com sucesso! Avançando...', 2000);
      setTimeout(() => {
        setStep('plano');
        hideLoading();

        // Atualizar progresso no localStorage
        const progress = {
          userId: userId,
          step: 'plano',
          timestamp: Date.now(),
        };
        localStorage.setItem('brutal-team-cadastro-coach', JSON.stringify(progress));
      }, 2000);

    } catch (err: any) {
      console.error('[Cadastro Coach] Erro ao enviar KYC:', err);
      setKycError(err.message || 'Erro ao enviar dados de verificação');
      hideLoading();
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara (00) 00000-0000
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade para continuar');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setError(null);
    showLoading('Criando sua conta...', 5000);

    try {
      console.log('[Cadastro Coach Frontend] Enviando dados:', {
        email,
        fullName,
        hasPassword: !!password,
        hasPhone: !!phone
      });

      const response = await fetch('/api/auth/cadastro-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phone.replace(/\D/g, ''), // Remove formatação
        }),
      });

      console.log('[Cadastro Coach Frontend] Response status:', response.status);

      const data = await response.json();
      console.log('[Cadastro Coach Frontend] Response data:', data);

      if (!response.ok) {
        console.error('[Cadastro Coach Frontend] Erro na resposta:', data);
        throw new Error(data.error || data.details || 'Erro ao criar conta');
      }

      hideLoading();

      // Salvar o userId para usar nas próximas etapas
      setUserId(data.userId);

      // Salvar progresso no localStorage
      const progress = {
        userId: data.userId,
        step: isLocalhost ? 'completo' : 'onboarding',
        timestamp: Date.now(),
      };
      localStorage.setItem('brutal-team-cadastro-coach', JSON.stringify(progress));
      console.log('[Cadastro Coach] Progresso salvo:', progress);

      // Se está em localhost, pular para sucesso direto
      if (isLocalhost) {
        setSuccess(true);
        showLoading('Conta criada! Redirecionando...', 3000);
        setTimeout(() => {
          hideLoading();
          localStorage.removeItem('brutal-team-cadastro-coach');
          router.push('/login');
        }, 2000);
      } else {
        // Em produção, avançar para o onboarding (KYC)
        console.log('[Cadastro Coach] Avançando para etapa 2: KYC');
        setStep('onboarding');
      }

    } catch (err: any) {
      console.error('[Cadastro Coach Frontend] Erro capturado:', err);
      const errorMessage = err.message || 'Erro ao criar conta';
      console.error('[Cadastro Coach Frontend] Mensagem de erro:', errorMessage);
      setError(errorMessage);
      hideLoading();
    } finally {
      setLoading(false);
    }
  };


  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    setError('');
    setSelectedPlan(planId);

    try {
      console.log('[Cadastro Coach] Criando sessão de checkout para plano:', planId);

      // Criar checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId, // Passar o userId que salvamos
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão de pagamento');
      }

      const { clientSecret } = await response.json();
      console.log('[Cadastro Coach] Client secret recebido, avançando para etapa 4: Pagamento');
      setCheckoutClientSecret(clientSecret);
      setStep('pagamento');

      // Atualizar progresso no localStorage
      const progress = {
        userId: userId,
        step: 'pagamento',
        timestamp: Date.now(),
      };
      localStorage.setItem('brutal-team-cadastro-coach', JSON.stringify(progress));
      console.log('[Cadastro Coach] Progresso atualizado:', progress);
    } catch (err: any) {
      console.error('[Cadastro Coach] Erro ao selecionar plano:', err);
      setError(err.message);
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };


  // Funções de navegação entre etapas
  const handleVoltarParaCadastro = () => {
    setStep('cadastro');
    setKycError('');
  };

  const handleVoltarParaOnboarding = () => {
    setStep('onboarding');
    setError('');
    setSelectedPlan(null);
    setCheckoutClientSecret(null);
  };

  const handleVoltarParaPlano = () => {
    setStep('plano');
    setError('');
    setCheckoutClientSecret(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white p-4">
      <div className="max-w-4xl w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <Image
              src="/logo.png"
              alt="Brutal Team"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Profissional</h1>
          <p className="text-center text-gray-600">
            {step === 'cadastro' && 'Passo 1: Crie sua conta'}
            {step === 'onboarding' && 'Passo 2: Complete seus dados bancários'}
            {step === 'plano' && 'Passo 3: Escolha seu plano'}
            {step === 'pagamento' && 'Passo 4: Finalize o pagamento'}
            {step === 'completo' && 'Cadastro completo!'}
          </p>

          {/* Indicador de progresso - 4 passos */}
          {!isLocalhost && step !== 'completo' && (
            <div className="flex items-center gap-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step === 'cadastro' ? 'bg-[#0081A7]' : 'bg-green-500'}`}></div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-3 h-3 rounded-full ${step === 'onboarding' ? 'bg-[#0081A7]' : ['plano', 'pagamento'].includes(step) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-3 h-3 rounded-full ${step === 'plano' ? 'bg-[#0081A7]' : step === 'pagamento' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-3 h-3 rounded-full ${step === 'pagamento' ? 'bg-[#0081A7]' : 'bg-gray-300'}`}></div>
            </div>
          )}
        </div>

        {/* Step: Mensagem de sucesso (localhost) */}
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-700 px-6 py-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
              <p className="font-semibold text-lg">Conta criada com sucesso!</p>
            </div>
            <div className="space-y-2 text-sm">
              <p>✅ Sua conta profissional foi criada</p>
              <p>✅ Sistema de pagamentos configurado</p>
              <p className="mt-4 font-medium">
                Próximos passos:
              </p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Faça login com suas credenciais</li>
                <li>Complete seus dados bancários</li>
                <li>Comece a convidar alunos!</li>
              </ol>
            </div>
            <p className="text-xs text-center mt-4 text-gray-600">Redirecionando para login...</p>
          </div>
        )}

        {/* Step: Cadastro Básico */}
        {step === 'cadastro' && !success && (
          <form onSubmit={handleCadastro} className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nome Completo *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
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

              <div className="md:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone/WhatsApp (opcional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha *
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {/* Informações sobre o que será criado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                O que você terá acesso:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Conta profissional no Brutal Team</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Sistema completo de pagamentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0" />
                  <span>Painel para gerenciar alunos e treinos</span>
                </li>
              </ul>
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
              {loading ? 'Criando conta...' : 'Criar Conta Profissional'}
            </button>

            <div className="text-center space-y-2">
              <Link href="/login" className="block text-sm text-primary-600 hover:text-primary-700 font-medium">
                Já tem uma conta? Faça login
              </Link>
              <Link href="/cadastro" className="block text-sm text-gray-600 hover:text-primary-600 font-medium">
                Quer se cadastrar como aluno?
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

        {/* Step: Onboarding KYC - Formulário Manual */}
        {step === 'onboarding' && !success && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Passo 2 de 4:</strong> Complete seus dados de verificação para poder receber pagamentos dos seus alunos. Estes dados são exigidos pela Stripe para conformidade regulatória.
              </p>
            </div>

            {/* Erro */}
            {kycError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{kycError}</p>
              </div>
            )}

            {/* Formulário KYC Manual */}
            <KYCForm
              onSubmit={handleKycSubmit}
              onBack={handleVoltarParaCadastro}
              loading={loading}
            />
          </div>
        )}

        {/* Step: Escolher Plano */}
        {step === 'plano' && !success && (
          <div className="space-y-6">
            {/* Botão Voltar */}
            <button
              onClick={handleVoltarParaOnboarding}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Voltar para Dados Bancários</span>
            </button>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✅ Dados bancários configurados!</strong> Agora escolha o plano que melhor se adequa ao seu negócio.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-lg p-6 relative transition-all cursor-pointer hover:shadow-lg ${
                    plan.popular
                      ? 'border-[#0081A7] bg-[#0081A7]/5'
                      : 'border-gray-300 hover:border-[#0081A7]'
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0081A7] text-white px-4 py-1 rounded-full text-xs font-semibold">
                      MAIS POPULAR
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-600">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && selectedPlan === plan.id}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-[#0081A7] text-white hover:bg-[#006685]'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading && selectedPlan === plan.id ? 'Processando...' : 'Escolher Plano'}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Pagamento */}
        {step === 'pagamento' && checkoutClientSecret && (
          <div className="space-y-6">
            {/* Botão Voltar */}
            <button
              onClick={handleVoltarParaPlano}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Voltar para Escolher Plano</span>
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Passo 4: Finalize o pagamento</strong> para ativar sua conta.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret: checkoutClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
