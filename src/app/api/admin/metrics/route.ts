import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { PLANS } from '@/config/plans'

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br'
const paletteColors = ['#0081A7', '#00AFB9', '#F07167', '#FED9B7', '#FDFCDC']

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabaseRoute = createRouteClient()
    const {
      data: { user },
    } = await supabaseRoute.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile || profile.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { startISO, endISO, startLabel, endLabel } = resolveRange(req)

    const [
      totalCoachesRes,
      activeCoachesRes,
      churnedCoachesRes,
      totalStudentsRes,
      activeStudentsRes,
      churnedStudentsRes,
      paymentsRes,
      coachPlansRes,
      activeCoachPlansRes,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'coach'),
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'coach')
        .in('stripe_subscription_status', ['active', 'trialing']),
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'coach')
        .in('stripe_subscription_status', ['canceled', 'unpaid', 'past_due']),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'aluno'),
      supabaseAdmin
        .from('coach_students')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabaseAdmin
        .from('coach_students')
        .select('id', { count: 'exact', head: true })
        .in('status', ['inactive', 'blocked']),
      supabaseAdmin
        .from('payments')
        .select(
          `
          id,
          coach_id,
          aluno_id,
          amount,
          platform_fee,
          coach_amount,
          status,
          paid_at,
          created_at,
          coach:coach_id(full_name, email),
          aluno:aluno_id(full_name, email)
        `
        )
        .eq('status', 'succeeded')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('profiles')
        .select('subscription_plan')
        .eq('role', 'coach'),
      supabaseAdmin
        .from('profiles')
        .select('subscription_plan')
        .eq('role', 'coach')
        .in('stripe_subscription_status', ['active', 'trialing'])
        .not('subscription_plan', 'is', null),
    ])

    if (paymentsRes.error) {
      console.error('[Admin Metrics] Error fetching payments', paymentsRes.error)
      return NextResponse.json({ error: 'Erro ao carregar pagamentos' }, { status: 500 })
    }

    const payments = paymentsRes.data || []

    let grossVolume = 0
    let platformRevenue = 0
    let coachPayouts = 0

    const chartMap = new Map<string, { gross: number; platform: number }>()
    const topCoachMap = new Map<
      string,
      { id: string; name: string; email: string | null; totalAmount: number; students: Set<string> }
    >()

    payments.forEach((payment: any) => {
      const amount = payment.amount || 0
      const platformFee = payment.platform_fee || 0
      const coachAmount = payment.coach_amount || 0

      grossVolume += amount
      platformRevenue += platformFee
      coachPayouts += coachAmount

      const paymentDate = payment.paid_at || payment.created_at
      const dayKey = formatDateKey(paymentDate)

      const existing = chartMap.get(dayKey) || { gross: 0, platform: 0 }
      existing.gross += amount
      existing.platform += platformFee
      chartMap.set(dayKey, existing)

      if (payment.coach_id) {
        const entry = topCoachMap.get(payment.coach_id) || {
          id: payment.coach_id,
          name: payment.coach?.full_name || payment.coach?.email || 'Coach',
          email: payment.coach?.email || null,
          totalAmount: 0,
          students: new Set<string>(),
        }
        entry.totalAmount += amount
        if (payment.aluno_id) {
          entry.students.add(payment.aluno_id)
        }
        topCoachMap.set(payment.coach_id, entry)
      }
    })

    const chartData = Array.from(chartMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, values]) => ({
        date: formatChartLabel(date),
        gross: values.gross / 100,
        platform: values.platform / 100,
      }))

    const topCoaches = Array.from(topCoachMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map((coach) => ({
        id: coach.id,
        name: coach.name,
        email: coach.email,
        totalAmount: coach.totalAmount,
        students: coach.students.size,
      }))

    const planCounts = new Map<string, number>()
    ;(coachPlansRes.data || []).forEach((coach) => {
      if (coach.subscription_plan) {
        planCounts.set(coach.subscription_plan, (planCounts.get(coach.subscription_plan) || 0) + 1)
      }
    })

    const planBreakdown = Array.from(planCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([planId, count], index) => {
        const planConfig = PLANS.find((p) => p.id === planId)
        return {
          id: planId,
          name: planConfig?.name || planId,
          count,
          color: paletteColors[index % paletteColors.length],
        }
      })

    const planPriceMap = PLANS.reduce<Record<string, number>>((acc, plan) => {
      acc[plan.id] = Math.round(plan.price * 100)
      return acc
    }, {})

    const coachSubscriptionMRR =
      activeCoachPlansRes.data?.reduce((sum, coach) => {
        if (!coach.subscription_plan) return sum
        return sum + (planPriceMap[coach.subscription_plan] || 0)
      }, 0) || 0

    const recentPayments = [...payments]
      .sort((a, b) => {
        const dateA = new Date(a.paid_at || a.created_at).getTime()
        const dateB = new Date(b.paid_at || b.created_at).getTime()
        return dateB - dateA
      })
      .slice(0, 20)

    return NextResponse.json({
      stats: {
        totalCoaches: totalCoachesRes.count || 0,
        activeCoaches: activeCoachesRes.count || 0,
        churnCoaches: churnedCoachesRes.count || 0,
        totalStudents: totalStudentsRes.count || 0,
        activeStudents: activeStudentsRes.count || 0,
        churnStudents: churnedStudentsRes.count || 0,
        grossVolume,
        platformRevenue,
        coachPayouts,
        coachSubscriptionMRR,
      },
      chartData,
      planBreakdown,
      topCoaches,
      recentPayments,
      range: {
        startDate: startLabel,
        endDate: endLabel,
      },
    })
  } catch (error: any) {
    console.error('[Admin Metrics] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar métricas' },
      { status: 500 }
    )
  }
}

function resolveRange(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const startParam = searchParams.get('startDate')
  const endParam = searchParams.get('endDate')

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const defaultStart = new Date(today)
  defaultStart.setDate(defaultStart.getDate() - 6)
  defaultStart.setHours(0, 0, 0, 0)

  const startDate = startParam ? parseDate(startParam, true) : defaultStart
  const endDate = endParam ? parseDate(endParam, false) : today

  return {
    startISO: startDate.toISOString(),
    endISO: endDate.toISOString(),
    startLabel: startParam || startDate.toISOString().split('T')[0],
    endLabel: endParam || endDate.toISOString().split('T')[0],
  }
}

function parseDate(value: string, startOfDay: boolean) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date()
    if (startOfDay) {
      fallback.setHours(0, 0, 0, 0)
    } else {
      fallback.setHours(23, 59, 59, 999)
    }
    return fallback
  }
  if (startOfDay) {
    date.setHours(0, 0, 0, 0)
  } else {
    date.setHours(23, 59, 59, 999)
  }
  return date
}

function formatDateKey(value: string | null) {
  const date = value ? new Date(value) : new Date()
  return date.toISOString().split('T')[0]
}

function formatChartLabel(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

