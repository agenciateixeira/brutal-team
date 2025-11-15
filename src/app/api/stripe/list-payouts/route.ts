import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

    // Buscar perfil do coach
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: 'Conta Stripe não encontrada' }, { status: 404 })
    }

    // Buscar as últimas 100 transferências
    const payouts = await stripe.payouts.list({
      limit: 100,
    }, {
      stripeAccount: profile.stripe_account_id,
    })

    // Buscar o saldo atual
    const balance = await stripe.balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    })

    // Formatar dados para exibição
    const transfers = payouts.data.map((payout) => ({
      id: payout.id,
      amount: payout.amount, // em centavos
      currency: payout.currency,
      status: payout.status,
      created: payout.created,
      arrival_date: payout.arrival_date,
      method: payout.method,
      type: payout.type,
      description: payout.description || '',
      failure_message: payout.failure_message || null,
    }))

    return NextResponse.json({
      payouts: transfers,
      total: payouts.data.length,
      has_more: payouts.has_more,
      balance: {
        available: balance.available,
        pending: balance.pending,
      },
    })

  } catch (error: any) {
    console.error('[List Payouts] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao buscar transferências',
      },
      { status: 500 }
    )
  }
}
