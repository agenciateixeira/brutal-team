import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Cancelar assinatura de aluno
 * POST /api/coach/cancel-student-subscription
 *
 * Body:
 * {
 *   subscriptionId: string, // UUID da subscription no banco
 *   cancelImmediately?: boolean, // true = cancelar agora, false = cancelar no fim do período
 *   reason?: string
 * }
 */
export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  })

  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { subscriptionId, cancelImmediately = false, reason } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      )
    }

    console.log('[Cancel Student Subscription] Iniciando cancelamento:', {
      subscriptionId,
      cancelImmediately,
      coach_id: user.id,
    })

    // 1. Buscar assinatura no banco
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, profiles:aluno_id(full_name, email)')
      .eq('id', subscriptionId)
      .eq('coach_id', user.id) // Garantir que é assinatura do coach autenticado
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Esta assinatura já está cancelada' },
        { status: 400 }
      )
    }

    // 2. Buscar perfil do coach para obter stripe_account_id
    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!coachProfile || !coachProfile.stripe_account_id) {
      return NextResponse.json(
        { error: 'Conta Stripe não encontrada' },
        { status: 400 }
      )
    }

    // 3. Cancelar assinatura no Stripe
    console.log('[Cancel Student Subscription] Cancelando no Stripe:', subscription.stripe_subscription_id)

    let stripeSubscription: Stripe.Subscription

    if (cancelImmediately) {
      // Cancelar imediatamente
      stripeSubscription = await stripe.subscriptions.cancel(
        subscription.stripe_subscription_id,
        {
          stripeAccount: coachProfile.stripe_account_id,
        }
      )
      console.log('[Cancel Student Subscription] Cancelada imediatamente')
    } else {
      // Cancelar no fim do período atual
      stripeSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            ...subscription.metadata,
            cancellation_reason: reason || 'Cancelado pelo coach',
          },
        },
        {
          stripeAccount: coachProfile.stripe_account_id,
        }
      )
      console.log('[Cancel Student Subscription] Marcada para cancelar no fim do período')
    }

    // 4. Atualizar assinatura no banco
    const updateData: any = {
      cancel_at_period_end: !cancelImmediately,
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    }

    if (cancelImmediately) {
      updateData.status = 'canceled'
      updateData.canceled_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('[Cancel Student Subscription] Erro ao atualizar banco:', updateError)
    }

    // 5. Atualizar status do aluno (se cancelado imediatamente)
    if (cancelImmediately) {
      await supabase
        .from('coach_students')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('coach_id', user.id)
        .eq('student_id', subscription.aluno_id)
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: cancelImmediately ? 'canceled' : 'active',
        cancel_at_period_end: !cancelImmediately,
        current_period_end: stripeSubscription.current_period_end,
      },
      message: cancelImmediately
        ? 'Assinatura cancelada imediatamente'
        : 'Assinatura será cancelada no fim do período atual',
    })
  } catch (error: any) {
    console.error('[Cancel Student Subscription] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao cancelar assinatura',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
