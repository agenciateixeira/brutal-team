'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps,
} from 'recharts'
import { Users, UserCheck, Wallet, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'
import Link from 'next/link'

type NumberLike = number | null | undefined

export interface AdminStats {
  totalCoaches: number
  activeCoaches: number
  churnCoaches: number
  totalStudents: number
  activeStudents: number
  churnStudents: number
  grossVolume: number
  platformRevenue: number
  coachPayouts: number
  coachSubscriptionMRR: number
}

export interface ChartPoint {
  date: string
  gross: number
  platform: number
}

export interface TopCoach {
  id: string
  name: string
  email: string
  totalAmount: number
  students: number
}

export interface RecentPayment {
  id: string
  amount: number
  platform_fee: number
  status: string
  paid_at: string | null
  created_at: string
  coach?: { full_name: string | null; email: string | null } | null
  aluno?: { full_name: string | null; email: string | null } | null
}

export interface PlanBreakdownItem {
  id: string
  name: string
  count: number
  color: string
}

interface Props {
  stats: AdminStats
  chartData: ChartPoint[]
  planBreakdown: PlanBreakdownItem[]
  topCoaches: TopCoach[]
  recentPayments: RecentPayment[]
}

const formatMoney = (valueInCents: number) => `R$ ${(valueInCents / 100).toFixed(2).replace('.', ',')}`
const formatMoneyFromUnits = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`

const formatNumber = (value: NumberLike) =>
  new Intl.NumberFormat('pt-BR').format(value || 0)

const palette = {
  primary: '#0081A7',
  secondary: '#00AFB9',
  accent: '#F07167',
}

const ChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="mt-1 flex items-center gap-2 text-sm font-semibold">
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">
            {entry.dataKey === 'gross' ? 'Pagamentos' : 'Taxa'}: {formatMoneyFromUnits(entry.value || 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardOverview({
  stats,
  chartData,
  planBreakdown,
  topCoaches,
  recentPayments,
}: Props) {
  const {
    totalCoaches,
    activeCoaches,
    churnCoaches,
    totalStudents,
    activeStudents,
    churnStudents,
    grossVolume,
    platformRevenue,
    coachPayouts,
    coachSubscriptionMRR,
  } = stats

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wider text-[#00AFB9]">Visão geral</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fluxo financeiro</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Acompanhe o desempenho da plataforma, assinaturas de coaches e pagamentos dos alunos em tempo real.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          title="Total de Coaches"
          value={totalCoaches}
          subtitle={`${activeCoaches} ativos • ${churnCoaches} churn`}
          icon={Users}
        />
        <StatCard
          title="Alunos ativos"
          value={totalStudents}
          subtitle={`${activeStudents} ativos • ${churnStudents} churn`}
          icon={UserCheck}
        />
        <StatCard
          title="Pagamentos (período)"
          value={formatMoney(grossVolume)}
          subtitle="Período selecionado"
          icon={Wallet}
          accent
        />
        <StatCard
          title="Taxa da plataforma"
          value={formatMoney(platformRevenue)}
          subtitle="Período selecionado"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#00AFB9]">Fluxo diário</p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pagamentos x Taxa</h2>
              <p className="text-sm text-gray-500">Últimos 60 dias</p>
            </div>
            <div className="rounded-full border border-[#0081A7]/20 bg-[#0081A7]/10 px-4 py-2 text-sm font-semibold text-[#0081A7] dark:border-[#064E63] dark:bg-[#032B36] dark:text-[#4DD0E1]">
              {formatMoney(grossVolume)} processados
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} interval={7} stroke="#94a3b8" />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="gross" stroke={palette.primary} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="platform" stroke={palette.accent} strokeWidth={2} dot={false} strokeDasharray="6 6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assinaturas de coaches</p>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{formatMoney(coachSubscriptionMRR)}</h3>
                <p className="text-xs text-gray-500">MRR estimado</p>
              </div>
              <div className="rounded-full bg-[#0081A7]/10 p-3 text-[#0081A7]">
                <Activity size={20} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {planBreakdown.slice(0, 4).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="text-gray-700 dark:text-gray-300">{plan.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{plan.count}</span>
                </div>
              ))}
              {planBreakdown.length === 0 && <p className="text-sm text-gray-500">Nenhum coach ativo.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Recebido pelos coaches</p>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{formatMoney(coachPayouts)}</h3>
                <p className="text-xs text-gray-500">Total desde o início</p>
              </div>
              <div className="rounded-full bg-[#00AFB9]/10 p-3 text-[#00AFB9]">
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/transacoes" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0081A7] hover:text-[#005c74]">
                Ver todas as transações
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Coaches</h2>
            <Link href="/admin/coaches" className="text-xs font-semibold text-[#0081A7] hover:text-[#005c74]">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {topCoaches.length === 0 && <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>}
            {topCoaches.map((coach, index) => (
              <div key={coach.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0081A7] to-[#00AFB9] text-white font-semibold">
                    {coach.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{coach.name}</p>
                    <p className="text-xs text-gray-500">{coach.students} alunos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatMoney(coach.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transações recentes</h2>
              <p className="text-sm text-gray-500">Últimos 20 pagamentos confirmados</p>
            </div>
            <Link href="/admin/transacoes" className="text-sm font-semibold text-[#0081A7] hover:text-[#005c74]">
              ver todas
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Coach</th>
                  <th className="px-6 py-3">Aluno</th>
                  <th className="px-6 py-3">Valor</th>
                  <th className="px-6 py-3">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60">
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-100">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{payment.coach?.full_name || 'Coach'}</p>
                      <p className="text-xs text-gray-500">{payment.coach?.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{payment.aluno?.full_name || 'Aluno'}</p>
                      <p className="text-xs text-gray-500">{payment.aluno?.email}</p>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="px-6 py-3 font-semibold text-[#0081A7]">
                      {formatMoney(payment.platform_fee)}
                    </td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      Nenhuma transação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ComponentType<{ size?: number }>
  accent?: boolean
}

function StatCard({ title, value, subtitle, icon: Icon, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 ${
        accent ? 'bg-gradient-to-br from-[#0081A7] to-[#00AFB9] text-white' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${accent ? 'text-white/80' : 'text-gray-500'}`}>{title}</p>
          <p className={`mt-2 text-3xl font-semibold ${accent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {typeof value === 'number' && !accent ? formatNumber(value) : value}
          </p>
          <p className={`text-xs ${accent ? 'text-white/80' : 'text-gray-500'}`}>{subtitle}</p>
        </div>
        <div
          className={`rounded-2xl p-3 ${
            accent
              ? 'bg-white/10 text-white'
              : 'bg-[#E0F7FA] text-[#0081A7] dark:bg-[#0F2C38] dark:text-[#4DD0E1]'
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
