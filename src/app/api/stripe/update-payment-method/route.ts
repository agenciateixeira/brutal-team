import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    // Verificar autenticação
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('aluno_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Criar sessão do Billing Portal do Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/aluno/dashboard`,
    })

    console.log('[UPDATE_PAYMENT] Billing portal criado:', {
      alunoId: user.id,
      customerId: subscription.stripe_customer_id,
      url: session.url,
    })

    return NextResponse.json({
      url: session.url,
    })
  } catch (error: any) {
    console.error('[UPDATE_PAYMENT] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    )
  }
}
