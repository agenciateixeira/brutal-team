'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { CreditCard, Calendar, AlertCircle, XCircle, CheckCircle } from 'lucide-react'
import { PLANS } from '@/config/plans'

export default function AssinaturaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Carregar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Carregar assinatura ativa
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('coach_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setSubscription(subscriptionData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      setError('Assinatura não encontrada')
      return
    }

    const confirmCancel = confirm(
      'Tem certeza que deseja cancelar sua assinatura?\n\n' +
      'Você perderá acesso à plataforma ao final do período atual.\n' +
      'Seus alunos também perderão acesso aos treinos e dietas.'
    )

    if (!confirmCancel) return

    setCanceling(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao cancelar assinatura')
      }

      const data = await response.json()
      setSuccess(
        'Assinatura cancelada com sucesso. ' +
        'Você terá acesso até ' + new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
      )

      // Recarregar dados
      await loadData()
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err)
      setError(err.message)
    } finally {
      setCanceling(false)
    }
  }

  const getCurrentPlan = () => {
    if (!subscription) return null
    return PLANS.find((p) => p.priceId === subscription.stripe_price_id)
  }

  const currentPlan = getCurrentPlan()
  const hasActiveSubscription =
    profile?.stripe_subscription_status === 'active' ||
    profile?.stripe_subscription_status === 'trialing'

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <AppLayout profile={profile}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={32} className="text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gerenciar Assinatura
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seu plano e forma de pagamento
          </p>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* Sem Assinatura */}
        {!hasActiveSubscription && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Você não possui uma assinatura ativa
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Para usar a plataforma, você precisa escolher um plano.
                </p>
                <button
                  onClick={() => router.push('/coach/assinatura')}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Escolher Plano
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assinatura Ativa */}
        {hasActiveSubscription && currentPlan && subscription && (
          <div className="space-y-6">
            {/* Card do Plano Atual */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Plano {currentPlan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile.stripe_subscription_status === 'trialing'
                      ? 'Período de teste (3 dias grátis)'
                      : 'Assinatura Ativa'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  subscription.cancel_at_period_end
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                }`}>
                  {subscription.cancel_at_period_end ? 'Cancelado' : 'Ativo'}
                </div>
              </div>

              {/* Detalhes do Plano */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Valor</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    R$ {currentPlan.price.toFixed(2).replace('.', ',')} / {currentPlan.interval}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Limite de alunos</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentPlan.maxAlunos === 999 ? 'Ilimitado' : currentPlan.maxAlunos}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Calendar size={16} />
                    Próxima cobrança
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {subscription.cancel_at_period_end
                      ? 'Não haverá'
                      : new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600 dark:text-gray-400">Acesso até</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recursos do Plano */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recursos inclusos
              </h4>
              <ul className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ações
              </h4>

              <div className="space-y-4">
                {/* Fazer Upgrade */}
                {!subscription.cancel_at_period_end && (
                  <button
                    onClick={() => router.push('/coach/assinatura')}
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Fazer Upgrade do Plano
                  </button>
                )}

                {/* Cancelar Assinatura */}
                {!subscription.cancel_at_period_end && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-6 py-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={20} />
                    {canceling ? 'Cancelando...' : 'Cancelar Assinatura'}
                  </button>
                )}

                {/* Reativar Assinatura */}
                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-700 dark:text-yellow-300 mb-3 text-sm">
                      Sua assinatura foi cancelada e terminará em{' '}
                      <strong>{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong>.
                      Para reativar, escolha um novo plano.
                    </p>
                    <button
                      onClick={() => router.push('/coach/assinatura')}
                      className="w-full bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Reativar Assinatura
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de Cancelamento */}
            {!subscription.cancel_at_period_end && (
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p className="font-medium">
                      Ao cancelar sua assinatura:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Você manterá acesso até o final do período pago</li>
                      <li>Seus alunos perderão acesso aos treinos e dietas</li>
                      <li>Seus dados serão mantidos por 30 dias</li>
                      <li>Você pode reativar a qualquer momento</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
