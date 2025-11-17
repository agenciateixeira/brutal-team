'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { AlertCircle, CreditCard, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function PagamentoPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: authLoading, session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [coach, setCoach] = useState<any>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      // Carregar subscription
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('aluno_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setSubscription(subscriptionData)

      // Carregar dados do coach
      if (profile.coach_id) {
        const { data: coachData } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', profile.coach_id)
          .single()

        setCoach(coachData)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Não foi possível carregar os dados de pagamento.')
    } finally {
      setLoading(false)
    }
  }, [profile, supabase])

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
  }, [authLoading, session, router])

  useEffect(() => {
    if (!authLoading && profile) {
      loadData()
    }
  }, [authLoading, profile, loadData])

  const handleUpdatePaymentMethod = async () => {
    if (!profile || !profile.coach_id) {
      setError('Não encontramos um coach vinculado ao seu perfil.')
      return
    }
    if (!subscription) {
      setError('Não encontramos uma assinatura para regularizar.')
      return
    }
    setProcessingPayment(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/student/subscribe-to-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachId: profile.coach_id,
          amount: subscription.amount,
          interval: subscription.interval || 'month',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao processar pagamento')
      }

      const { sessionUrl } = await response.json()

      if (sessionUrl) {
        window.location.href = sessionUrl
      }
    } catch (err: any) {
      console.error('Erro ao atualizar forma de pagamento:', err)
      setError(err.message || 'Erro ao iniciar o pagamento.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getHoursSinceOverdue = () => {
    if (!subscription?.updated_at) return 0
    const updatedAt = new Date(subscription.updated_at)
    const now = new Date()
    return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60))
  }

  const hoursRemaining = Math.max(0, 24 - getHoursSinceOverdue())

  const isOverdue = subscription?.status === 'past_due' || subscription?.status === 'unpaid'
  const isBlocked = isOverdue && getHoursSinceOverdue() >= 24

  if (authLoading || loading || (!profile && session)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Sessão expirada. Faça login novamente.</div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={32} className="text-red-600 dark:text-red-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isBlocked ? 'Acesso Bloqueado' : 'Atenção: Pagamento Pendente'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isBlocked
              ? 'Seu acesso foi bloqueado devido à inadimplência'
              : 'Seu pagamento está atrasado. Regularize para manter o acesso.'}
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

        {/* Status Card */}
        <div className={`mb-6 rounded-xl border p-6 ${
          isBlocked
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start gap-4">
            {isBlocked ? (
              <AlertCircle size={48} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            ) : (
              <Clock size={48} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-semibold mb-2 ${
                isBlocked
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {isBlocked
                  ? 'Acesso Bloqueado'
                  : `Tempo Restante: ${hoursRemaining}h`}
              </h3>
              <p className={`mb-4 ${
                isBlocked
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {isBlocked
                  ? 'Seu acesso à plataforma foi bloqueado. Regularize o pagamento para recuperar o acesso aos treinos, dietas e protocolos.'
                  : 'Seu pagamento está atrasado há mais de 24 horas. Regularize agora para evitar o bloqueio total do acesso.'}
              </p>

              {subscription && (
                <div className="space-y-2 text-sm">
                  <div className={`flex justify-between ${
                    isBlocked
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    <span>Valor mensal:</span>
                    <span className="font-semibold">
                      R$ {(subscription.amount / 100).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className={`flex justify-between ${
                    isBlocked
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    <span>Dia de vencimento:</span>
                    <span className="font-semibold">
                      Todo dia {subscription.payment_due_day}
                    </span>
                  </div>
                  <div className={`flex justify-between ${
                    isBlocked
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    <span>Status:</span>
                    <span className="font-semibold">
                      {subscription.status === 'past_due' ? 'Atrasado' : 'Não pago'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ação de Pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Regularizar Pagamento
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Atualize sua forma de pagamento ou regularize seu débito para recuperar o acesso imediato à plataforma.
          </p>

          <button
            onClick={handleUpdatePaymentMethod}
            disabled={processingPayment || !subscription}
            className="w-full bg-[#0081A7] text-white px-6 py-4 rounded-lg hover:bg-[#006685] transition-colors font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={24} />
            {processingPayment
              ? 'Processando...'
              : 'Atualizar Forma de Pagamento'}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Você será redirecionado para o Stripe (processador de pagamento seguro)
          </p>
        </div>

        {/* Informações de Contato do Coach */}
        {coach && (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Precisa de ajuda?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Entre em contato com seu coach:
            </p>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <span className="font-medium">Coach:</span> {coach.full_name}
              </div>
              {coach.email && (
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a
                    href={`mailto:${coach.email}`}
                    className="text-[#0081A7] hover:underline"
                  >
                    {coach.email}
                  </a>
                </div>
              )}
              {coach.phone && (
                <div>
                  <span className="font-medium">Telefone:</span>{' '}
                  <a
                    href={`https://wa.me/${coach.phone.replace(/\D/g, '')}`}
                    className="text-[#0081A7] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {coach.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
