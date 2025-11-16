import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const providedSubscriptionId = body?.subscriptionId as string | undefined

    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    const subscriptionId = providedSubscriptionId || profile?.stripe_subscription_id

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    await supabase
      .from('profiles')
      .update({
        stripe_subscription_status: canceledSubscription.status,
      })
      .eq('id', user.id)

    console.log('[CANCEL_SUBSCRIPTION] Assinatura cancelada:', {
      subscriptionId,
      userId: user.id,
      cancelAt: canceledSubscription.cancel_at,
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      cancelAt: canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
      currentPeriodEnd: canceledSubscription.current_period_end
        ? new Date(canceledSubscription.current_period_end * 1000).toISOString()
        : null,
      status: canceledSubscription.status,
    })
  } catch (error: any) {
    console.error('[CANCEL_SUBSCRIPTION] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}
