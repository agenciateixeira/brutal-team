import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Supabase com service_role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook Stripe para processar eventos de subscription
 * POST /api/webhooks/stripe
 *
 * Eventos processados:
 * - checkout.session.completed: Quando checkout finaliza
 * - customer.subscription.created: Quando subscription é criada
 * - customer.subscription.updated: Quando subscription é atualizada
 * - customer.subscription.deleted: Quando subscription é cancelada
 * - invoice.payment_succeeded: Quando pagamento recorrente é bem-sucedido
 * - invoice.payment_failed: Quando pagamento falha
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
      console.error('[Stripe Webhook] Signature missing')
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 })
    }

    // Verificar signature do webhook
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('[Stripe Webhook] Invalid signature:', err.message)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    console.log('[Stripe Webhook] Event received:', event.type, event.id)

    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed
 * Quando um checkout é finalizado com sucesso
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Checkout completed:', session.id)

  const coachId = session.metadata?.coach_id
  const studentId = session.metadata?.student_id

  if (!coachId || !studentId) {
    console.log('[Webhook] Missing metadata in checkout session')
    return
  }

  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    console.log('[Webhook] No subscription in checkout session')
    return
  }

  // A subscription já foi ou será criada pelo evento customer.subscription.created
  console.log('[Webhook] Checkout completed, subscription will be handled by subscription.created event')
}

/**
 * Handle customer.subscription.created and customer.subscription.updated
 * Criar ou atualizar subscription no banco
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('[Webhook] Subscription update:', subscription.id, subscription.status)

  const coachId = subscription.metadata.coach_id
  const studentId = subscription.metadata.student_id

  if (!coachId || !studentId) {
    console.log('[Webhook] Missing metadata in subscription')
    return
  }

  // Verificar se subscription já existe
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const subscriptionData = {
    aluno_id: studentId,
    coach_id: coachId,
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
    const { error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', existing.id)

    if (error) {
      console.error('[Webhook] Error updating subscription:', error)
    } else {
      console.log('[Webhook] Subscription updated:', existing.id)
    }
  } else {
    // Criar
    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)

    if (error) {
      console.error('[Webhook] Error creating subscription:', error)
    } else {
      console.log('[Webhook] Subscription created')
    }
  }
}

/**
 * Handle customer.subscription.deleted
 * Marcar subscription como cancelada
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Webhook] Subscription deleted:', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('[Webhook] Error updating subscription to canceled:', error)
  } else {
    console.log('[Webhook] Subscription marked as canceled')
  }
}

/**
 * Handle invoice.payment_succeeded
 * Registrar pagamento bem-sucedido
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[Webhook] Payment succeeded:', invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('[Webhook] No subscription in invoice')
    return
  }

  // Buscar subscription no banco
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.log('[Webhook] Subscription not found for invoice')
    return
  }

  const chargeId = invoice.charge as string
  const platformFee = invoice.application_fee_amount || 0
  const coachAmount = invoice.total - platformFee
  const stripeFee = invoice.total - invoice.amount_paid // Aproximação da taxa Stripe

  // Criar registro de pagamento
  const { error } = await supabase
    .from('payments')
    .insert({
      aluno_id: subscription.aluno_id,
      coach_id: subscription.coach_id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_charge_id: chargeId,
      stripe_invoice_id: invoice.id,
      amount: invoice.total,
      platform_fee: platformFee,
      coach_amount: coachAmount,
      stripe_fee: stripeFee,
      status: 'succeeded',
      payment_method: 'card',
      description: `Pagamento recorrente - ${invoice.period_start}`,
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      metadata: {
        subscription_id: subscription.id,
        invoice_number: invoice.number,
      },
    })

  if (error) {
    console.error('[Webhook] Error creating payment record:', error)
  } else {
    console.log('[Webhook] Payment record created')
  }
}

/**
 * Handle invoice.payment_failed
 * Marcar pagamento como falho e atualizar status da subscription
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Webhook] Payment failed:', invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log('[Webhook] No subscription in invoice')
    return
  }

  // Atualizar status da subscription para past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[Webhook] Error updating subscription to past_due:', error)
  } else {
    console.log('[Webhook] Subscription marked as past_due')
  }

  // TODO: Enviar notificação para coach e aluno
}
