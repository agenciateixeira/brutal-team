import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

/**
 * API: Sincronizar subscription do Stripe para o banco
 * POST /api/coach/sync-student-subscription
 *
 * Body:
 * {
 *   studentId: string  // ID do aluno
 * }
 *
 * Busca todas as subscriptions do aluno no Stripe e sincroniza no banco
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Sync Subscription] Not authenticated')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { studentId } = await req.json()

    if (!studentId) {
      console.error('[Sync Subscription] Missing studentId')
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 })
    }

    console.log('[Sync Subscription] Syncing subscription for student:', studentId)

    // Usar service_role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, coach_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      console.error('[Sync Subscription] Student not found:', studentError)
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Verificar se o aluno pertence a este coach
    if (student.coach_id !== user.id) {
      console.error('[Sync Subscription] Student does not belong to this coach')
      return NextResponse.json({ error: 'Aluno não pertence a este coach' }, { status: 403 })
    }

    // Buscar informações do coach para acessar a conta Stripe conectada
    const { data: coachProfile, error: coachError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (coachError || !coachProfile?.stripe_account_id) {
      console.error('[Sync Subscription] Coach missing Stripe account:', coachError)
      return NextResponse.json(
        { error: 'Configuração do Stripe não encontrada para este coach' },
        { status: 400 }
      )
    }

    const stripeAccountId = coachProfile.stripe_account_id

    console.log('[Sync Subscription] Student email:', student.email)

    // Primeiro, tentar buscar pelo payment_invitation para pegar o stripe_session_id
    const { data: invitation } = await supabaseAdmin
      .from('payment_invitations')
      .select('stripe_session_id, metadata')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let subscriptionId: string | null = null

    // Se tiver stripe_session_id, buscar a subscription pela session
    if (invitation?.stripe_session_id) {
      console.log('[Sync Subscription] Found invitation with session:', invitation.stripe_session_id)

      try {
        const session = await stripe.checkout.sessions.retrieve(
          invitation.stripe_session_id,
          { stripeAccount: stripeAccountId }
        )
        subscriptionId = session.subscription as string
        console.log('[Sync Subscription] Found subscription from session:', subscriptionId)
      } catch (err) {
        console.error('[Sync Subscription] Error retrieving session:', err)
      }
    }

    // Se não encontrou pela session, tentar pelo email
    if (!subscriptionId) {
      console.log('[Sync Subscription] Trying to find customer by email:', student.email)

      const customers = await stripe.customers.list(
        {
          email: student.email,
          limit: 1,
        },
        {
          stripeAccount: stripeAccountId,
        }
      )

      if (customers.data.length === 0) {
        console.error('[Sync Subscription] No Stripe customer found for email:', student.email)
        return NextResponse.json(
          {
            error: 'Não foi possível sincronizar automaticamente. Por favor, entre em contato com o suporte.',
            details: `Nenhum cliente encontrado no Stripe para o email ${student.email}. Pode ser que o pagamento tenha sido feito com outro email.`
          },
          { status: 404 }
        )
      }

      const customer = customers.data[0]
      console.log('[Sync Subscription] Found Stripe customer:', customer.id)

      // Buscar todas as subscriptions do customer
      const subscriptions = await stripe.subscriptions.list(
        {
          customer: customer.id,
          limit: 1,
        },
        {
          stripeAccount: stripeAccountId,
        }
      )

      if (subscriptions.data.length === 0) {
        return NextResponse.json(
          {
            error: 'Cliente encontrado mas sem assinaturas ativas no Stripe.',
            details: 'O cliente existe no Stripe mas não possui assinaturas.'
          },
          { status: 404 }
        )
      }

      subscriptionId = subscriptions.data[0].id
    }

    // Buscar a subscription completa
    const subscription = await stripe.subscriptions.retrieve(subscriptionId!, {
      stripeAccount: stripeAccountId,
    })
    console.log('[Sync Subscription] Retrieved subscription:', subscription.id, 'status:', subscription.status)

    // Processar e sincronizar a subscription
    console.log('[Sync Subscription] Processing subscription:', subscription.id, 'status:', subscription.status)

    // Verificar se já existe no banco
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    const subscriptionData = {
      aluno_id: studentId,
      coach_id: student.coach_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0]?.price.id,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      payment_due_day: new Date(subscription.current_period_end * 1000).getDate(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      // Atualizar
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existing.id)

      if (error) {
        console.error('[Sync Subscription] Error updating subscription:', error)
        throw error
      }

      console.log('[Sync Subscription] Updated subscription:', existing.id)

      return NextResponse.json({
        success: true,
        message: 'Assinatura sincronizada com sucesso!',
        subscription: {
          id: existing.id,
          stripe_id: subscription.id,
          status: subscription.status,
          amount: subscriptionData.amount,
        },
      })
    } else {
      // Criar
      const { data: newSubscription, error } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single()

      if (error) {
        console.error('[Sync Subscription] Error creating subscription:', error)
        throw error
      }

      console.log('[Sync Subscription] Created subscription:', newSubscription.id)

      return NextResponse.json({
        success: true,
        message: 'Assinatura criada com sucesso!',
        subscription: {
          id: newSubscription.id,
          stripe_id: subscription.id,
          status: subscription.status,
          amount: subscriptionData.amount,
        },
      })
    }
  } catch (error: any) {
    console.error('[Sync Subscription] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao sincronizar assinatura',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
