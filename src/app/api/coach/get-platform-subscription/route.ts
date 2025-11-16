import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw profileError || new Error('Perfil não encontrado')
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({
        profile,
        subscription: null,
      })
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

      const normalizedSubscription = {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        price_id: subscription.items.data[0]?.price?.id || null,
        amount: subscription.items.data[0]?.price?.unit_amount || 0,
        interval: subscription.items.data[0]?.price?.recurring?.interval || null,
      }

      return NextResponse.json({
        profile,
        subscription: normalizedSubscription,
      })
    } catch (stripeError) {
      console.error('[Coach Subscription] Error retrieving Stripe data:', stripeError)

      return NextResponse.json({
        profile,
        subscription: null,
        warning: 'Não foi possível carregar os detalhes da assinatura no Stripe.',
      })
    }
  } catch (error: any) {
    console.error('[Coach Subscription] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar assinatura',
      },
      { status: 500 }
    )
  }
}
