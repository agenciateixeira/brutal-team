import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

/**
 * API: Sincronizar subscription do Stripe para o banco
 * POST /api/coach/sync-student-subscription
 *
 * Body:
 * {
 *   studentId: string  // ID do aluno
 * }
 *
 * Busca todas as subscriptions do aluno no Stripe e sincroniza no banco
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Sync Subscription] Not authenticated')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { studentId } = await req.json()

    if (!studentId) {
      console.error('[Sync Subscription] Missing studentId')
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 })
    }

    console.log('[Sync Subscription] Syncing subscription for student:', studentId)

    // Usar service_role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, coach_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      console.error('[Sync Subscription] Student not found:', studentError)
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Verificar se o aluno pertence a este coach
    if (student.coach_id !== user.id) {
      console.error('[Sync Subscription] Student does not belong to this coach')
      return NextResponse.json({ error: 'Aluno não pertence a este coach' }, { status: 403 })
    }

    console.log('[Sync Subscription] Student email:', student.email)

    // Buscar customer do Stripe pelo email
    const customers = await stripe.customers.list({
      email: student.email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      console.error('[Sync Subscription] No Stripe customer found for email:', student.email)
      return NextResponse.json(
        { error: 'Nenhum cliente encontrado no Stripe para este email' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]
    console.log('[Sync Subscription] Found Stripe customer:', customer.id)

    // Buscar todas as subscriptions do customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    })

    console.log('[Sync Subscription] Found', subscriptions.data.length, 'subscriptions')

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada no Stripe para este aluno' },
        { status: 404 }
      )
    }

    // Sincronizar cada subscription
    let syncedCount = 0
    for (const subscription of subscriptions.data) {
      console.log('[Sync Subscription] Processing subscription:', subscription.id, 'status:', subscription.status)

      // Verificar se já existe no banco
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      const subscriptionData = {
        aluno_id: studentId,
        coach_id: student.coach_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0]?.price.id,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.currency,
        interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        payment_due_day: new Date(subscription.current_period_end * 1000).getDate(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        // Atualizar
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existing.id)

        if (error) {
          console.error('[Sync Subscription] Error updating subscription:', error)
        } else {
          console.log('[Sync Subscription] Updated subscription:', existing.id)
          syncedCount++
        }
      } else {
        // Criar
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptionData)

        if (error) {
          console.error('[Sync Subscription] Error creating subscription:', error)
        } else {
          console.log('[Sync Subscription] Created subscription')
          syncedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount} assinatura(s) sincronizada(s) com sucesso`,
      synced: syncedCount,
      total: subscriptions.data.length,
    })
  } catch (error: any) {
    console.error('[Sync Subscription] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao sincronizar assinatura',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
