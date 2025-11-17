'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminDashboardOverview, {
  AdminStats,
  ChartPoint,
  PlanBreakdownItem,
  TopCoach,
  RecentPayment,
} from './AdminDashboardOverview'

type RangeOption = 'today' | '7d' | 'custom'

interface AdminMetricsResponse {
  stats: AdminStats
  chartData: ChartPoint[]
  planBreakdown: PlanBreakdownItem[]
  topCoaches: TopCoach[]
  recentPayments: RecentPayment[]
  range: {
    startDate: string
    endDate: string
  }
}

const initialStats: AdminStats = {
  totalCoaches: 0,
  activeCoaches: 0,
  churnCoaches: 0,
  totalStudents: 0,
  activeStudents: 0,
  churnStudents: 0,
  grossVolume: 0,
  platformRevenue: 0,
  coachPayouts: 0,
  coachSubscriptionMRR: 0,
}

const initialData: AdminMetricsResponse = {
  stats: initialStats,
  chartData: [],
  planBreakdown: [],
  topCoaches: [],
  recentPayments: [],
  range: {
    startDate: '',
    endDate: '',
  },
}

const quickRanges: { id: RangeOption; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: 'custom', label: 'Personalizado' },
]

const formatDateInput = (date: Date) => date.toISOString().split('T')[0]

const getRangeValues = (option: RangeOption) => {
  const end = new Date()
  if (option === 'today') {
    const start = new Date(end)
    return {
      start: formatDateInput(start),
      end: formatDateInput(end),
    }
  }

  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
  }
}

export default function AdminDashboardClient() {
  const defaultRange = useMemo(() => getRangeValues('7d'), [])
  const [range, setRange] = useState<RangeOption>('7d')
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [customStart, setCustomStart] = useState(defaultRange.start)
  const [customEnd, setCustomEnd] = useState(defaultRange.end)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<AdminMetricsResponse>(initialData)

  useEffect(() => {
    const controller = new AbortController()
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError('')
        const params = new URLSearchParams({ startDate, endDate })
        const response = await fetch(`/api/admin/metrics?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error || 'Erro ao carregar métricas')
        }

        setData(payload)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError(err.message || 'Erro ao carregar métricas')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    return () => controller.abort()
  }, [startDate, endDate])

  const handleRangeChange = (option: RangeOption) => {
    setRange(option)
    if (option === 'custom') return
    const { start, end } = getRangeValues(option)
    setStartDate(start)
    setEndDate(end)
    setCustomStart(start)
    setCustomEnd(end)
  }

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return
    setRange('custom')
    setStartDate(customStart)
    setEndDate(customEnd)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {quickRanges.map((option) => (
          <button
            key={option.id}
            onClick={() => handleRangeChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              range === option.id
                ? 'bg-[#0081A7] text-white'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm dark:bg-gray-800/80">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700 focus:border-[#00AFB9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <span className="text-sm text-gray-500">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700 focus:border-[#00AFB9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              onClick={handleApplyCustom}
              className="rounded-full bg-[#00AFB9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0081A7]"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-12 text-center text-sm font-semibold text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-300">
          Carregando métricas...
        </div>
      ) : (
        <AdminDashboardOverview
          stats={data.stats}
          chartData={data.chartData}
          planBreakdown={data.planBreakdown}
          topCoaches={data.topCoaches}
          recentPayments={data.recentPayments}
        />
      )}
    </div>
  )
}

