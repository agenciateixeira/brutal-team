'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { loadConnectAndInitialize } from '@stripe/connect-js'

export default function DadosBancarios() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stripeConnect, setStripeConnect] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verificar se está em localhost
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    loadProfile()

    // Verificar sucesso na URL
    if (searchParams.get('success') === 'true') {
      setSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (profile && !isLocalhost) {
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

      console.log('[Dados Bancários] Profile carregado:', {
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
      console.log('[Dados Bancários] Inicializando Stripe Connect Embedded...')
      console.log('[Dados Bancários] Hostname:', window.location.hostname)
      console.log('[Dados Bancários] isLocalhost:', isLocalhost)

      const stripeConnectInstance = loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          console.log('[Dados Bancários] Buscando Account Session...')
          const response = await fetch('/api/stripe/create-account-session', {
            method: 'POST',
          })

          console.log('[Dados Bancários] Response status:', response.status)

          if (!response.ok) {
            const errorData = await response.json()
            console.error('[Dados Bancários] Erro na resposta:', errorData)
            throw new Error(errorData.error || 'Erro ao criar sessão')
          }

          const { clientSecret } = await response.json()
          console.log('[Dados Bancários] Client secret recebido')
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
      console.log('[Dados Bancários] Stripe Connect inicializado com sucesso')
    } catch (err: any) {
      console.error('[Dados Bancários] Erro ao inicializar:', err)
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

  return (
    <AppLayout profile={profile}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dados Bancários
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure seus dados bancários para receber pagamentos dos alunos
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  ✅ Cadastro Concluído!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Seus dados bancários foram configurados com sucesso. Agora você pode receber pagamentos dos seus alunos.
                </p>
              </div>
            </div>
          </div>
        )}

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
                  ⚠️ Desenvolvimento Local Detectado
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  Você está usando chaves LIVE do Stripe, que requerem HTTPS. Em localhost, o formulário de dados bancários não pode ser exibido.
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded p-4 text-sm text-yellow-900 dark:text-yellow-100 space-y-3">
                  <div>
                    <p className="font-semibold mb-2">💡 Opção 1: Testar em Produção (Recomendado)</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Acesse a aplicação em produção (Vercel com HTTPS)</li>
                      <li>Tudo funcionará automaticamente</li>
                      <li>O formulário de dados bancários aparecerá aqui</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-yellow-200 dark:border-yellow-700">
                    <p className="font-semibold mb-2">🔧 Opção 2: Usar Chaves de Teste</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Obtenha as chaves de teste no <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-700">Dashboard do Stripe</a></li>
                      <li>Substitua no arquivo <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">.env.local</code>:</li>
                    </ul>
                    <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                      <div>STRIPE_SECRET_KEY=sk_test_...</div>
                      <div>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</div>
                    </div>
                    <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                      ⚠️ Lembre-se de voltar para as chaves LIVE antes de fazer deploy em produção!
                    </p>
                  </div>

                  <div className="pt-3 border-t border-yellow-200 dark:border-yellow-700">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      <strong>Nota:</strong> As chaves de teste permitem testar toda a funcionalidade sem processar pagamentos reais.
                    </p>
                  </div>
                </div>
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

        {/* Embedded Onboarding Component */}
        {!isLocalhost && stripeConnect && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <stripe-connect-account-onboarding
              stripe-connect={stripeConnect}
              on-exit={async () => {
                console.log('[Dados Bancários] Onboarding concluído, atualizando status...')

                try {
                  // Atualizar status da conta Stripe no perfil
                  const response = await fetch('/api/stripe/connect-status')
                  const data = await response.json()

                  console.log('[Dados Bancários] Status atualizado:', data)

                  // Redirecionar para dashboard (middleware vai validar se KYC está completo)
                  router.push('/coach/dashboard')
                } catch (err) {
                  console.error('[Dados Bancários] Erro ao atualizar status:', err)
                  // Mesmo com erro, tentar redirecionar
                  router.push('/coach/dashboard')
                }
              }}
            />
          </div>
        )}

        {/* Informações sobre o processo */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 Como funciona?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">1.</span>
              <span>Você preenche seus dados bancários diretamente aqui no Brutal Team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">2.</span>
              <span>Seus dados são validados de forma segura</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">3.</span>
              <span>Após aprovação, você pode receber pagamentos dos seus alunos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">4.</span>
              <span>As transferências para sua conta são automáticas</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💰 Taxas e Prazos
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Taxa da plataforma: 2% por transação</li>
              <li>• Taxa de processamento: ~3,99% + R$ 0,40</li>
              <li>• Prazo de recebimento: Até 7 dias úteis</li>
              <li>• Transferências automáticas</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
