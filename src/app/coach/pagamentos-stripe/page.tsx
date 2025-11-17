'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description: string
  customer_email: string
  payment_method: string
  refunded: boolean
  net_amount: number
}

export default function PagamentosStripe() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.stripe_account_id) {
      loadPayments()
    }
  }, [profile])

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

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/stripe/list-payments')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar pagamentos')
      }

      const data = await response.json()
      setPayments(data.payments)
    } catch (err: any) {
      console.error('Erro ao carregar pagamentos:', err)
      setError(err.message)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100)
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp * 1000))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      succeeded: { label: 'Pago', class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' },
      failed: { label: 'Falhou', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
    }

    const statusInfo = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    )
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

        {/* Erro */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Lista de Pagamentos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Bruto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Líquido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Método
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Nenhum pagamento recebido ainda
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(payment.created)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {payment.customer_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(payment.net_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                        {payment.refunded && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                            Reembolsado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {payment.payment_method}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
              <span>O valor líquido já desconta as taxas da plataforma e processamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">•</span>
              <span>As transferências para sua conta acontecem automaticamente em até 30 dias</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
