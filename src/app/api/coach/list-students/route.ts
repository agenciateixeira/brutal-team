import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Listar alunos do coach com informações de assinatura
 * GET /api/coach/list-students
 *
 * Query params:
 * - status: 'active' | 'inactive' | 'all' (default: 'all')
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') || 'all'

    console.log('[List Students] Listando alunos do coach:', user.id, 'status:', statusFilter)

    // Buscar alunos com informações de assinatura
    let query = supabase
      .from('coach_students')
      .select(
        `
        id,
        student_id,
        status,
        notes,
        created_at,
        updated_at,
        last_interaction_at,
        student:profiles!coach_students_student_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })

    // Aplicar filtro de status se especificado
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: students, error: studentsError } = await query

    if (studentsError) {
      throw studentsError
    }

    // Para cada aluno, buscar a assinatura ativa (se houver)
    const studentsWithSubscriptions = await Promise.all(
      students.map(async (student: any) => {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('coach_id', user.id)
          .eq('aluno_id', student.student_id)
          .in('status', ['active', 'trialing', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Buscar histórico de pagamentos
        const { data: payments, count: paymentsCount } = await supabase
          .from('payments')
          .select('*', { count: 'exact' })
          .eq('coach_id', user.id)
          .eq('aluno_id', student.student_id)
          .eq('status', 'succeeded')

        // Calcular total recebido do aluno
        const totalReceived = payments?.reduce((sum, payment) => sum + (payment.coach_amount || 0), 0) || 0

        return {
          id: student.id,
          student: student.student,
          status: student.status,
          notes: student.notes,
          created_at: student.created_at,
          updated_at: student.updated_at,
          last_interaction_at: student.last_interaction_at,
          subscription: subscription
            ? {
                id: subscription.id,
                stripe_subscription_id: subscription.stripe_subscription_id,
                status: subscription.status,
                amount: subscription.amount,
                interval: subscription.interval,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                trial_end: subscription.trial_end,
              }
            : null,
          stats: {
            total_payments: paymentsCount || 0,
            total_received: totalReceived,
          },
        }
      })
    )

    // Calcular estatísticas gerais
    const stats = {
      total_students: students.length,
      active_students: students.filter((s: any) => s.status === 'active').length,
      inactive_students: students.filter((s: any) => s.status === 'inactive').length,
      blocked_students: students.filter((s: any) => s.status === 'blocked').length,
      active_subscriptions: studentsWithSubscriptions.filter(
        (s) => s.subscription && ['active', 'trialing'].includes(s.subscription.status)
      ).length,
      monthly_recurring_revenue: studentsWithSubscriptions
        .filter((s) => s.subscription && s.subscription.status === 'active')
        .reduce((sum, s) => sum + (s.subscription?.amount || 0), 0),
    }

    console.log('[List Students] Stats:', stats)

    return NextResponse.json({
      students: studentsWithSubscriptions,
      stats,
    })
  } catch (error: any) {
    console.error('[List Students] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao listar alunos',
      },
      { status: 500 }
    )
  }
}
