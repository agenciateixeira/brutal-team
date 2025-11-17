'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import { Search, Filter, RefreshCw } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description: string
  customer_email: string
  customer_name?: string
  payment_method: string
  refunded: boolean
  net_amount: number
  application_fee_amount: number
  amount_refunded: number
  receipt_url?: string
  invoice_id?: string | null
  subscription_id?: string | null
}

interface PaymentSummary {
  gross: number
  net: number
  fees: number
  refunded: number
}

type RangeOption = '7d' | '30d' | 'custom'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100)

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))

const getRangeValues = (option: RangeOption) => {
  const end = new Date()
  const start = new Date()

  switch (option) {
    case '7d':
      start.setDate(start.getDate() - 6)
      break
    case '30d':
      start.setDate(start.getDate() - 29)
      break
    case 'custom':
    default:
      start.setDate(start.getDate() - 29)
      break
  }

  const format = (date: Date) => date.toISOString().split('T')[0]

  return {
    start: format(start),
    end: format(end),
  }
}

export default function PagamentosStripe() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')
  const [range, setRange] = useState<RangeOption>('30d')
  const defaultRange = useMemo(() => getRangeValues('30d'), [])
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [summary, setSummary] = useState<PaymentSummary>({ gross: 0, net: 0, fees: 0, refunded: 0 })
  const [isFetching, setIsFetching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.stripe_account_id) {
      loadPayments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, startDate, endDate, statusFilter, appliedSearch])

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
    if (!profile?.stripe_account_id) return
    try {
      setIsFetching(true)
      setError('')

      const params = new URLSearchParams()
      params.set('limit', '25')
      params.set('startDate', startDate)
      params.set('endDate', endDate)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (appliedSearch) params.set('search', appliedSearch)

      const response = await fetch(`/api/stripe/list-payments?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar pagamentos')
      }

      const data = await response.json()
      setPayments(data.payments || [])
      setSummary(data.summary || { gross: 0, net: 0, fees: 0, refunded: 0 })
      setNextCursor(data.next_cursor || null)
      setHasMore(Boolean(data.has_more && data.next_cursor))
    } catch (err: any) {
      console.error('Erro ao carregar pagamentos:', err)
      setError(err.message)
    } finally {
      setIsFetching(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = async () => {
    if (!profile?.stripe_account_id) return
    if (!nextCursor || isLoadingMore) return
    try {
      setIsLoadingMore(true)
      const params = new URLSearchParams()
      params.set('limit', '25')
      params.set('startDate', startDate)
      params.set('endDate', endDate)
      params.set('starting_after', nextCursor)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (appliedSearch) params.set('search', appliedSearch)

      const response = await fetch(`/api/stripe/list-payments?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar mais pagamentos')
      }

      const data = await response.json()
      setPayments((prev) => {
        const existingIds = new Set(prev.map((payment) => payment.id))
        const merged = [...prev]
        data.payments.forEach((payment: Payment) => {
          if (!existingIds.has(payment.id)) {
            merged.push(payment)
          }
        })
        return merged
      })
      setSummary(data.summary || summary)
      setNextCursor(data.next_cursor || null)
      setHasMore(Boolean(data.has_more && data.next_cursor))
    } catch (err: any) {
      console.error('Erro ao carregar mais pagamentos:', err)
      setError(err.message)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleRangeChange = (option: RangeOption) => {
    setRange(option)
    if (option === 'custom') return
    const { start, end } = getRangeValues(option)
    setStartDate(start)
    setEndDate(end)
  }

  const handleApplyCustom = () => {
    if (!startDate || !endDate) return
    if (new Date(startDate) > new Date(endDate)) {
      setError('A data inicial não pode ser maior que a data final')
      return
    }
    setRange('custom')
    setError('')
    loadPayments()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch(searchInput.trim())
  }

  const handleRefresh = () => {
    loadPayments()
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
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamentos Recebidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize todos os pagamentos recebidos dos seus alunos
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-2">
            {(['7d', '30d', 'custom'] as RangeOption[]).map((option) => (
              <button
                key={option}
                onClick={() => handleRangeChange(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  range === option
                    ? 'bg-[#0081A7] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {option === '7d' && 'Últimos 7 dias'}
                {option === '30d' && 'Últimos 30 dias'}
                {option === 'custom' && 'Personalizado'}
              </button>
            ))}

            <button
              onClick={handleRefresh}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {range === 'custom' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                <label className="mb-1">Data inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#00AFB9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                <label className="mb-1">Data final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#00AFB9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                className="rounded-full bg-[#00AFB9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0081A7]"
              >
                Aplicar
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
              <label className="mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#00AFB9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="all">Todos</option>
                <option value="succeeded">Pagos</option>
                <option value="pending">Pendentes</option>
                <option value="failed">Falhos</option>
                <option value="refunded">Reembolsados</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 items-center rounded-full border border-gray-200 px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por email, nome ou descrição"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 bg-transparent px-2 text-sm text-gray-700 focus:outline-none dark:text-gray-200"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#0081A7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006685]"
              >
                <Filter size={16} />
                Filtrar
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Receita (período)" value={formatCurrency(summary.gross)} subtitle="Valor bruto" />
          <SummaryCard title="Valor líquido" value={formatCurrency(summary.net)} subtitle="Após taxas" />
          <SummaryCard title="Taxas" value={formatCurrency(summary.fees)} subtitle="Plataforma + Stripe" />
          <SummaryCard title="Reembolsos" value={formatCurrency(summary.refunded)} subtitle="Total estornado" />
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
                {isFetching ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Carregando pagamentos...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
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

        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
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

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}
