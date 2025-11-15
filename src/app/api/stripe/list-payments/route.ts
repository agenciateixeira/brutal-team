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

    // Buscar os últimos 100 pagamentos
    const charges = await stripe.charges.list({
      limit: 100,
    }, {
      stripeAccount: profile.stripe_account_id,
    })

    // Formatar dados para exibição
    const payments = charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount, // em centavos
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      description: charge.description || '',
      customer_email: charge.billing_details?.email || '',
      payment_method: charge.payment_method_details?.type || 'card',
      refunded: charge.refunded,
      net_amount: charge.amount - (charge.application_fee_amount || 0), // valor líquido
    }))

    return NextResponse.json({
      payments,
      total: charges.data.length,
      has_more: charges.has_more,
    })

  } catch (error: any) {
    console.error('[List Payments] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao buscar pagamentos',
      },
      { status: 500 }
    )
  }
}
