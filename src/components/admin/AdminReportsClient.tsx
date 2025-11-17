'use client'

import { useMemo, useState } from 'react'
import { CreditCard, DollarSign, Filter, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { formatCentsToBRL } from '@/lib/currency'

type Payment = {
  id: string
  status: string
  amount: number | null
  platform_fee: number | null
  created_at: string
  paid_at: string | null
  payment_method: string | null
}

type Coach = {
  id: string
  full_name?: string | null
  subscriptions?: {
    status?: string | null
  }[] | null
}

type Student = {
  id: string
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'

interface AdminReportsClientProps {
  payments: Payment[]
  coaches: Coach[]
  alunos: Student[]
  dataError?: string | null
  usingFallbackClient: boolean
}

export default function AdminReportsClient({
  payments,
  coaches,
  alunos,
  dataError,
  usingFallbackClient,
}: AdminReportsClientProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredPayments = useMemo(() => {
    if (period === 'all') return payments

    const now = new Date()
    let filterDate = new Date()

    switch (period) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0)
        return payments.filter((p) => new Date(p.created_at) >= filterDate)
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        return payments.filter((p) => new Date(p.created_at) >= filterDate)
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        return payments.filter((p) => new Date(p.created_at) >= filterDate)
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        return payments.filter((p) => new Date(p.created_at) >= filterDate)
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return payments.filter((p) => {
            const date = new Date(p.created_at)
            return date >= start && date <= end
          })
        }
        return payments
      default:
        return payments
    }
  }, [payments, period, startDate, endDate])

  const succeededPayments = filteredPayments.filter((p) => p.status === 'succeeded')
  const totalRevenue = succeededPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0)
  const totalVolume = succeededPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalTransactions = filteredPayments.length
  const avgTicket = succeededPayments.length > 0 ? totalVolume / succeededPayments.length : 0

  const currentMonth = new Date()
  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)

  const currentMonthRevenue = payments
    .filter((p) => {
      const date = new Date(p.created_at)
      return (
        p.status === 'succeeded' &&
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      )
    })
    .reduce((sum, p) => sum + (p.platform_fee || 0), 0)

  const lastMonthRevenue = payments
    .filter((p) => {
      const date = new Date(p.created_at)
      return (
        p.status === 'succeeded' &&
        date.getMonth() === lastMonth.getMonth() &&
        date.getFullYear() === lastMonth.getFullYear()
      )
    })
    .reduce((sum, p) => sum + (p.platform_fee || 0), 0)

  const growth =
    lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const monthlyData = payments
    .filter((p) => p.status === 'succeeded')
    .reduce<Record<string, { month: string; revenue: number; volume: number; count: number }>>(
      (acc, payment) => {
        const date = new Date(payment.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            revenue: 0,
            volume: 0,
            count: 0,
          }
        }

        acc[monthKey].revenue += payment.platform_fee || 0
        acc[monthKey].volume += payment.amount || 0
        acc[monthKey].count += 1
        return acc
      },
      {}
    )

  const monthlyChartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)

  const maxRevenue =
    monthlyChartData.length > 0
      ? Math.max(...monthlyChartData.map((data) => data.revenue))
      : 0

  const activeCoaches = coaches.filter((coach) =>
    coach.subscriptions?.some((sub) => sub?.status === 'active' || sub?.status === 'trialing')
  ).length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <a
          href="/admin/dashboard"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#0081A7] dark:hover:text-[#4DD0E1] mb-2 inline-block"
        >
          ← Voltar ao Dashboard
        </a>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Relatórios e Análises
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análise completa da receita e transações da plataforma
        </p>
      </div>

      {dataError && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-semibold">Não conseguimos carregar todos os dados agora.</p>
          <p className="mt-1 text-xs opacity-80">{dataError}</p>
        </div>
      )}

      {!dataError && usingFallbackClient && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          <p className="font-semibold">Listando com permissões limitadas.</p>
          <p className="text-xs opacity-80">
            Configure <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> para garantir a
            visão completa das métricas administrativas.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros de Período</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Período Rápido
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00AFB9]"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Último mês</option>
              <option value="year">Último ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00AFB9]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00AFB9]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Receita (2%)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCentsToBRL(totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Volume: {formatCentsToBRL(totalVolume)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Crescimento Mensal</p>
              <p
                className={`text-3xl font-bold ${
                  growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-[#F07167]'
                }`}
              >
                {growth >= 0 ? '+' : ''}
                {growth.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs mês anterior</p>
            </div>
            <div
              className={`w-12 h-12 ${
                growth >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-[#FEE4DE] dark:bg-[#5A1F16]'
              } rounded-lg flex items-center justify-center`}
            >
              {growth >= 0 ? (
                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown size={24} className="text-[#F07167]" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transações</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {succeededPayments.length} bem-sucedidas
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ticket Médio</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCentsToBRL(avgTicket)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Por transação</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Receita Mensal (Últimos 12 meses)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {monthlyChartData.length > 0 ? (
              <div className="space-y-4">
                {monthlyChartData.map((data) => {
                  const percentage =
                    maxRevenue > 0 ? Math.max((data.revenue / maxRevenue) * 100, 4) : 0

                  return (
                    <div key={data.month} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(`${data.month}-01`).toLocaleDateString('pt-BR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#0081A7] to-[#00AFB9] h-full rounded-full flex items-center justify-end px-3 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCentsToBRL(data.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-32 text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {data.count} transações
                        </div>
                        <div className="text-xs text-gray-500">
                          Vol: {formatCentsToBRL(data.volume)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-[#0081A7]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Coaches</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {coaches.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Ativos</span>
              <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                {activeCoaches}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-[#00AFB9]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alunos</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {alunos.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
