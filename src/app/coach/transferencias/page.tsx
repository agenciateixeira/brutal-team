'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  arrival_date: number
  method: string
  type: string
  description: string
  failure_message: string | null
}

interface Balance {
  available: { amount: number; currency: string }[]
  pending: { amount: number; currency: string }[]
}

export default function Transferencias() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [balance, setBalance] = useState<Balance | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.stripe_account_id) {
      loadPayouts()
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

  const loadPayouts = async () => {
    try {
      const response = await fetch('/api/stripe/list-payouts')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar transferências')
      }

      const data = await response.json()
      setPayouts(data.payouts)
      setBalance(data.balance)
    } catch (err: any) {
      console.error('Erro ao carregar transferências:', err)
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
    }).format(new Date(timestamp * 1000))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      paid: { label: 'Pago', class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' },
      in_transit: { label: 'Em Trânsito', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
      canceled: { label: 'Cancelado', class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200' },
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

        {/* Cards de Saldo */}
        {balance && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Saldo Disponível
              </h3>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(balance.available[0]?.amount || 0)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Pronto para transferência
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Saldo Pendente
              </h3>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {formatCurrency(balance.pending[0]?.amount || 0)}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Aguardando liberação
              </p>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Lista de Transferências */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Chegada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
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
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma transferência realizada ainda
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(payout.created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(payout.arrival_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                        {payout.failure_message && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {payout.failure_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {payout.method === 'standard' ? 'Transferência bancária' : payout.method}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações sobre o processo */}
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
                <span>Transferências automáticas em até 30 dias úteis</span>
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
