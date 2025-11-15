import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'
import { getPlanById } from '@/config/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { planId } = await req.json()

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    if (!plan.priceId || plan.priceId === 'PRICE_ID_AQUI') {
      return NextResponse.json(
        { error: 'Price ID não configurado para este plano' },
        { status: 400 }
      )
    }

    // Buscar ou criar customer
    let { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        name: profile?.name || '',
        metadata: {
          user_id: user.id,
          platform: 'brutal_team',
        },
      })

      customerId = customer.id

      // Salvar customer_id no banco
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Criar sessão de checkout embedded usando o Price ID existente
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      ui_mode: 'embedded',
      payment_method_types: ['card'], // ✅ APENAS CARTÃO (boleto não funciona com subscription)
      line_items: [
        {
          price: plan.priceId, // Usar Price ID do produto já criado no Stripe
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3, // 3 dias grátis
        metadata: {
          user_id: user.id,
          plan: planId,
        },
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/coach/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        plan: planId,
      },
    })

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Erro ao criar checkout session:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar sessão de pagamento',
      },
      { status: 500 }
    )
  }
}
