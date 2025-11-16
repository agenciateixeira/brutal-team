import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura não fornecido' },
        { status: 400 }
      )
    }

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

    // Verificar se a assinatura pertence ao usuário
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('coach_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Cancelar assinatura no Stripe (no final do período)
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    )

    // Atualizar no banco de dados
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    console.log('[CANCEL_SUBSCRIPTION] Assinatura cancelada:', {
      subscriptionId,
      coachId: user.id,
      cancelAt: canceledSubscription.cancel_at,
    })

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      cancelAt: canceledSubscription.cancel_at,
    })
  } catch (error: any) {
    console.error('[CANCEL_SUBSCRIPTION] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
}
