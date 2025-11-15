import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  })
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[verify-session] Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      console.error('[verify-session] Session ID não fornecido')
      return NextResponse.json(
        { error: 'Session ID não fornecido' },
        { status: 400 }
      )
    }

    console.log('[verify-session] Buscando sessão:', sessionId)

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    console.log('[verify-session] Sessão encontrada:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      subscription: session.subscription,
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({
        success: false,
        error: 'Pagamento não confirmado',
      })
    }

    const subscriptionId = session.subscription as string
    const planId = session.metadata?.plan || 'basic'

    // Atualizar profile do usuário
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: 'active',
        subscription_plan: planId,
        approved: true, // Aprovar automaticamente
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar profile:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      plan: planId,
      subscriptionId,
    })
  } catch (error: any) {
    console.error('[verify-session] Erro completo:', error)
    console.error('[verify-session] Stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar pagamento',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
