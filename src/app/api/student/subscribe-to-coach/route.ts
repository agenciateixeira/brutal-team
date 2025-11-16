import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * API: Criar checkout session para aluno assinar coach
 * POST /api/student/subscribe-to-coach
 *
 * Body:
 * {
 *   coachId: string, // UUID do coach
 *   planId?: string, // UUID do plano (se coach tiver planos customizados)
 *   amount?: number, // valor em centavos (se não usar planId)
 *   interval?: 'month' | 'week' | 'year'
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

    const { coachId, planId, amount, interval = 'month', invitationToken } = await req.json()

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID é obrigatório' }, { status: 400 })
    }

    if (!planId && !amount) {
      return NextResponse.json(
        { error: 'Você deve especificar um planId ou um valor (amount)' },
        { status: 400 }
      )
    }

    console.log('[Subscribe to Coach] Iniciando checkout:', {
      student_id: user.id,
      coachId,
      planId,
      amount,
    })

    // 1. Buscar perfil do coach
    const { data: coachProfile, error: coachError } = await supabase
      .from('profiles')
      .select('id, full_name, email, stripe_account_id, stripe_charges_enabled')
      .eq('id', coachId)
      .single()

    if (coachError || !coachProfile) {
      return NextResponse.json({ error: 'Coach não encontrado' }, { status: 404 })
    }

    if (!coachProfile.stripe_account_id || !coachProfile.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Este coach ainda não está habilitado para receber pagamentos' },
        { status: 400 }
      )
    }

    // 2. Verificar se aluno já tem assinatura ativa com este coach
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('aluno_id', user.id)
      .eq('coach_id', coachId)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Você já tem uma assinatura ativa com este coach' },
        { status: 400 }
      )
    }

    // 3. Buscar ou criar plano
    let priceAmount = amount
    let priceInterval = interval
    let stripePriceId: string | null = null

    if (planId) {
      // Buscar plano customizado do coach
      const { data: plan, error: planError } = await supabase
        .from('coach_subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('coach_id', coachId)
        .eq('active', true)
        .single()

      if (planError || !plan) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }

      priceAmount = plan.amount
      priceInterval = plan.interval
      stripePriceId = plan.stripe_price_id
    }

    // 4. Criar Customer do aluno na conta do coach
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // SEMPRE criar novo customer na conta conectada do coach
    // Customers não são compartilhados entre contas Stripe
    console.log('[Subscribe to Coach] Criando Customer na conta do coach')
    const customer = await stripe.customers.create(
      {
        email: studentProfile?.email || user.email || '',
        name: studentProfile?.full_name || '',
        metadata: {
          user_id: user.id,
          platform: 'brutal_team',
          role: 'student',
          coach_id: coachId,
        },
      },
      {
        stripeAccount: coachProfile.stripe_account_id,
      }
    )

    const customerId = customer.id
    console.log('[Subscribe to Coach] Customer criado na conta do coach:', customerId)

    // 5. Se não tem stripePriceId, criar Price
    if (!stripePriceId) {
      console.log('[Subscribe to Coach] Criando Product e Price no Stripe')

      const product = await stripe.products.create(
        {
          name: `Assinatura - ${coachProfile.full_name || 'Coach'}`,
          description: `Coaching com ${coachProfile.full_name}`,
          metadata: {
            coach_id: coachId,
            platform: 'brutal_team',
          },
        },
        {
          stripeAccount: coachProfile.stripe_account_id,
        }
      )

      const price = await stripe.prices.create(
        {
          product: product.id,
          currency: 'brl',
          recurring: {
            interval: priceInterval as 'month' | 'week' | 'day' | 'year',
            interval_count: 1,
          },
          unit_amount: priceAmount,
          metadata: {
            coach_id: coachId,
            platform: 'brutal_team',
          },
        },
        {
          stripeAccount: coachProfile.stripe_account_id,
        }
      )

      stripePriceId = price.id
      console.log('[Subscribe to Coach] Price criado:', stripePriceId)
    }

    // 6. Criar Checkout Session
    console.log('[Subscribe to Coach] Criando Checkout Session')

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          application_fee_percent: 2, // 2% para plataforma
          metadata: {
            coach_id: coachId,
            student_id: user.id,
            platform: 'brutal_team',
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/coaches/${coachId}`,
        metadata: {
          coach_id: coachId,
          student_id: user.id,
          platform: 'brutal_team',
        },
      },
      {
        stripeAccount: coachProfile.stripe_account_id,
      }
    )

    console.log('[Subscribe to Coach] Checkout Session criada:', session.id)

    // Atualizar convite como completed se veio de um convite
    if (invitationToken) {
      console.log('[Subscribe to Coach] Marcando convite como completed:', invitationToken)

      // Usar service_role para bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { error: invitationError } = await supabaseAdmin
        .from('payment_invitations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          student_id: user.id,
        })
        .eq('token', invitationToken)
        .eq('status', 'pending')

      if (invitationError) {
        console.error('[Subscribe to Coach] Erro ao atualizar convite:', invitationError)
      } else {
        console.log('[Subscribe to Coach] Convite marcado como completed')
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      coach: {
        id: coachProfile.id,
        name: coachProfile.full_name,
        email: coachProfile.email,
      },
      subscription: {
        amount: priceAmount,
        interval: priceInterval,
      },
    })
  } catch (error: any) {
    console.error('[Subscribe to Coach] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar checkout',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
