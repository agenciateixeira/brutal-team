'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { loadConnectAndInitialize } from '@stripe/connect-js'

export default function Transferencias() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stripeConnect, setStripeConnect] = useState<any>(null)
  const [error, setError] = useState('')

  // Verificar se está em localhost
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.stripe_account_id && !isLocalhost) {
      initializeStripeConnect()
    }
  }, [profile, isLocalhost])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('[Transferências] Profile carregado:', {
        hasProfile: !!profileData,
        hasStripeAccountId: !!profileData?.stripe_account_id,
        stripeAccountId: profileData?.stripe_account_id
      })

      setProfile(profileData)
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setError('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const initializeStripeConnect = async () => {
    try {
      console.log('[Transferências] Inicializando Stripe Connect Embedded...')

      const stripeConnectInstance = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          const response = await fetch('/api/stripe/create-account-session', {
            method: 'POST',
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Erro ao criar sessão')
          }

          const { clientSecret } = await response.json()
          return clientSecret
        },
        appearance: {
          variables: {
            colorPrimary: '#0081A7',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '8px',
          },
        },
      })

      setStripeConnect(stripeConnectInstance)
      console.log('[Transferências] Stripe Connect inicializado com sucesso')
    } catch (err: any) {
      console.error('[Transferências] Erro ao inicializar:', err)
      setError(err.message || 'Erro ao inicializar componentes')
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  // Se não tem conta Stripe, redirecionar para configurar
  if (!profile.stripe_account_id) {
    return (
      <AppLayout profile={profile}>
        <div className="max-w-4xl mx-auto py-16 px-4 text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8">
            <svg className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Configure seus Dados Bancários
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você precisa cadastrar seus dados bancários antes de visualizar as transferências.
            </p>
            <button
              onClick={() => router.push('/coach/dados-bancarios')}
              className="bg-[#0081A7] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006685] transition-colors"
            >
              Cadastrar Dados Bancários
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Transferências para Conta Bancária
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe todas as transferências do Stripe para sua conta bancária
          </p>
        </div>

        {/* Aviso de Localhost */}
        {isLocalhost && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  ⚠️ Funcionalidade Disponível Apenas em Produção (HTTPS)
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  O componente de transferências requer HTTPS. Em produção, você verá aqui:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 ml-4">
                  <li>• Histórico completo de transferências</li>
                  <li>• Valores transferidos para sua conta</li>
                  <li>• Status de cada transferência (pendente, pago, falhado)</li>
                  <li>• Datas previstas de depósito</li>
                  <li>• Detalhes de taxas descontadas</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Link Direto para Dashboard do Stripe */}
        {!isLocalhost && profile?.stripe_account_id && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 text-[#0081A7] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Visualize suas Transferências no Dashboard do Stripe
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Clique no botão abaixo para acessar o painel completo de transferências do Stripe, onde você pode ver:
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
                <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Histórico completo de todas as transferências
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Valores transferidos e datas de depósito
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Status de cada transferência (processando, pago, falhado)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Detalhes de taxas e valores líquidos
                  </li>
                </ul>
              </div>

              <a
                href={`https://connect.stripe.com/express/${profile.stripe_account_id}/payouts`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0081A7] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#006685] transition-colors text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir Dashboard de Transferências
              </a>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Abrirá em uma nova aba no site seguro do Stripe
              </p>
            </div>
          </div>
        )}

        {/* Informações */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💰 Como Funciona
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                <span>Alunos fazem pagamentos → Valor vai para o Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                <span>Stripe desconta taxas (plataforma + processamento)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                <span>Valor líquido é transferido para sua conta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">4.</span>
                <span>Transferências automáticas em até 7 dias úteis</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
              📊 Exemplo de Cálculo
            </h3>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <div className="flex justify-between">
                <span>Pagamento do Aluno:</span>
                <span className="font-bold">R$ 100,00</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Taxa Plataforma (2%):</span>
                <span className="font-bold">- R$ 2,00</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Taxa Stripe (~4%):</span>
                <span className="font-bold">- R$ 4,39</span>
              </div>
              <div className="border-t border-green-300 dark:border-green-700 my-2"></div>
              <div className="flex justify-between text-lg font-bold">
                <span>Você Recebe:</span>
                <span className="text-green-700 dark:text-green-300">R$ 93,61</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
