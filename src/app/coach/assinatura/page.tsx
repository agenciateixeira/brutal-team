'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layouts/AppLayout'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { PLANS } from '@/config/plans'

const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não está definida')
    return null
  }
  return loadStripe(key)
}

const stripePromise = getStripePromise()

import { useAuth } from '@/contexts/AuthContext'

export default function GerenciarAssinatura() {
  const router = useRouter()
  const { profile, loading: authLoading, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
  }, [authLoading, session, router])

  const handleSelectPlan = async (planId: string) => {
    setLoading(true)
    setError('')
    setSelectedPlan(planId)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar sessão de pagamento')
      }

      const { clientSecret: secret } = await response.json()
      setClientSecret(secret)
    } catch (err: any) {
      console.error('Erro ao selecionar plano:', err)
      setError(err.message)
      setSelectedPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = () => {
    setClientSecret(null)
    setSelectedPlan(null)
  }

  const getCurrentPlan = () => {
    if (!profile?.subscription_plan) return null
    return PLANS.find((p) => p.id === profile.subscription_plan)
  }

  const currentPlan = getCurrentPlan()
  const hasActiveSubscription =
    profile?.stripe_subscription_status === 'active' ||
    profile?.stripe_subscription_status === 'trialing'

  if (authLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (clientSecret) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <button
            onClick={handleReturn}
            className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            ← Voltar
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Finalizar Pagamento
            </h2>

            {stripePromise ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div className="text-center text-red-600 dark:text-red-400">
                Erro: Stripe não configurado. Verifique as variáveis de ambiente.
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gerenciar Assinatura
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {hasActiveSubscription
              ? 'Sua assinatura atual e opções de upgrade'
              : 'Escolha um plano para começar'}
          </p>
        </div>

        {/* Plano Atual */}
        {hasActiveSubscription && currentPlan && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Plano Ativo: {currentPlan.name}
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-2">
                  R$ {currentPlan.price.toFixed(2).replace('.', ',')} / mês
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Status:{' '}
                  {profile.stripe_subscription_status === 'trialing'
                    ? 'Período de teste (3 dias grátis)'
                    : 'Ativo'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Limite de alunos
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {currentPlan.maxAlunos === 999
                    ? 'Ilimitado'
                    : currentPlan.maxAlunos}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Planos Disponíveis */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {hasActiveSubscription ? 'Fazer Upgrade' : 'Escolher Plano'}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id
              const isUpgrade =
                currentPlan && plan.price > currentPlan.price

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${
                    plan.popular
                      ? 'ring-2 ring-[#0081A7] transform scale-105'
                      : ''
                  } ${isCurrentPlan ? 'opacity-60' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-[#0081A7] text-white px-4 py-1 rounded-full text-sm font-medium">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-medium">
                      Plano Atual
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /{plan.interval}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Até {plan.maxAlunos === 999 ? 'ilimitados' : plan.maxAlunos}{' '}
                      alunos
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <svg
                          className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={
                      isCurrentPlan ||
                      (loading && selectedPlan === plan.id)
                    }
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-[#0081A7] text-white hover:bg-[#006685]'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isCurrentPlan
                      ? 'Plano Atual'
                      : loading && selectedPlan === plan.id
                      ? 'Processando...'
                      : isUpgrade
                      ? 'Fazer Upgrade'
                      : 'Assinar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Informações */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            🔒 Pagamento seguro processado pelo Stripe
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            💳 Apenas cartão de crédito
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ⚠️ Boleto não está disponível para assinaturas
          </p>
          {!hasActiveSubscription && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              ✨ 3 dias grátis para testar · Cancele quando quiser
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
