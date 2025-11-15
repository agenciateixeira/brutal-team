'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { loadConnectAndInitialize } from '@stripe/connect-js'

export default function PagamentosStripe() {
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
      console.log('[Pagamentos Stripe] Inicializando Stripe Connect Embedded...')

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
      console.log('[Pagamentos Stripe] Stripe Connect inicializado com sucesso')
    } catch (err: any) {
      console.error('[Pagamentos Stripe] Erro ao inicializar:', err)
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
              Você precisa cadastrar seus dados bancários antes de visualizar os pagamentos.
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
            Pagamentos Recebidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize todos os pagamentos recebidos dos seus alunos
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
                  O componente de pagamentos requer HTTPS. Em produção, você verá aqui uma lista completa com:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 ml-4">
                  <li>• Todos os pagamentos recebidos</li>
                  <li>• Filtros por data, valor e status</li>
                  <li>• Paginação automática</li>
                  <li>• Opção de reembolso</li>
                  <li>• Cronograma de transferências</li>
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

        {/* Embedded Payments Component */}
        {!isLocalhost && stripeConnect && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '600px' }}>
            <stripe-connect-payments
              stripe-connect={stripeConnect}
            />
          </div>
        )}

        {/* Informações */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Sobre os Pagamentos
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>Os pagamentos aparecem aqui automaticamente quando seus alunos pagam</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>Você pode filtrar por data, valor, status e método de pagamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>Reembolsos podem ser feitos diretamente nesta interface</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>As transferências para sua conta acontecem automaticamente em até 7 dias</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
