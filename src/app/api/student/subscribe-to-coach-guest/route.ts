import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * API: Criar checkout session SEM autenticação (guest)
 * POST /api/student/subscribe-to-coach-guest
 *
 * Body:
 * {
 *   invitationToken: string,
 *   studentPhone?: string
 * }
 *
 * Fluxo:
 * 1. Busca invitation pelo token
 * 2. Cria checkout session no Stripe
 * 3. Retorna URL do checkout
 * 4. Usuário será criado DEPOIS do pagamento (via webhook)
 */
export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  })

  try {
    const { invitationToken, studentPhone } = await req.json()

    if (!invitationToken) {
      return NextResponse.json({ error: 'Token do convite é obrigatório' }, { status: 400 })
    }

    console.log('[Subscribe Guest] Buscando convite:', invitationToken)

    // Usar service_role para bypass RLS (não há usuário autenticado)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Buscar convite
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('payment_invitations')
      .select(`
        *,
        coach:profiles!payment_invitations_coach_id_fkey (
          id,
          full_name,
          email,
          stripe_account_id,
          stripe_charges_enabled
        )
      `)
      .eq('token', invitationToken)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      console.error('[Subscribe Guest] Convite não encontrado:', invitationError)
      return NextResponse.json({ error: 'Convite não encontrado ou já utilizado' }, { status: 404 })
    }

    // Verificar se convite expirou
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este convite expirou' }, { status: 400 })
    }

    const coach = invitation.coach as any

    if (!coach.stripe_account_id || !coach.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Este coach ainda não está habilitado para receber pagamentos' },
        { status: 400 }
      )
    }

    console.log('[Subscribe Guest] Criando Product e Price no Stripe')

    // 2. Criar Product e Price no Stripe
    const product = await stripe.products.create(
      {
        name: `Assinatura - ${coach.full_name || 'Coach'}`,
        description: invitation.description || `Coaching com ${coach.full_name}`,
        metadata: {
          coach_id: coach.id,
          platform: 'brutal_team',
          invitation_token: invitationToken,
        },
      },
      {
        stripeAccount: coach.stripe_account_id,
      }
    )

    const price = await stripe.prices.create(
      {
        product: product.id,
        currency: 'brl',
        recurring: {
          interval: invitation.interval as 'month' | 'week' | 'day' | 'year',
          interval_count: 1,
        },
        unit_amount: invitation.amount,
        metadata: {
          coach_id: coach.id,
          platform: 'brutal_team',
          invitation_token: invitationToken,
        },
      },
      {
        stripeAccount: coach.stripe_account_id,
      }
    )

    console.log('[Subscribe Guest] Criando Checkout Session')

    // 3. Criar Checkout Session
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      customer_email: invitation.student_email, // Preenche email automaticamente
      subscription_data: {
        application_fee_percent: 2, // 2% para plataforma
        metadata: {
          coach_id: coach.id,
          student_email: invitation.student_email,
          student_name: invitation.student_name,
          student_phone: studentPhone || invitation.student_phone || '',
          invitation_token: invitationToken,
          platform: 'brutal_team',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/${invitationToken}`,
      metadata: {
        coach_id: coach.id,
        student_email: invitation.student_email,
        student_name: invitation.student_name,
        student_phone: studentPhone || invitation.student_phone || '',
        invitation_token: invitationToken,
        platform: 'brutal_team',
      },
    }

    // Adicionar trial se configurado
    if (invitation.trial_days && invitation.trial_days > 0) {
      sessionData.subscription_data!.trial_period_days = invitation.trial_days
    }

    const session = await stripe.checkout.sessions.create(sessionData, {
      stripeAccount: coach.stripe_account_id,
    })

    console.log('[Subscribe Guest] Checkout Session criado:', session.id)

    // Atualizar convite com telefone se fornecido
    if (studentPhone) {
      await supabaseAdmin
        .from('payment_invitations')
        .update({ student_phone: studentPhone })
        .eq('token', invitationToken)
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
      invitation: {
        studentName: invitation.student_name,
        studentEmail: invitation.student_email,
        amount: invitation.amount,
        interval: invitation.interval,
        trialDays: invitation.trial_days,
      },
    })
  } catch (error: any) {
    console.error('[Subscribe Guest] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar checkout',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
