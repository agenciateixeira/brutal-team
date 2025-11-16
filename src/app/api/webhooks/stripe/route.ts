import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendSubscriptionCanceledEmail,
  sendRefundEmail,
} from '@/lib/resend'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Supabase com service_role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.brutalteam.blog.br'

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

      case 'charge.refunded':
      case 'charge.refund.updated':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
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
 *
 * NOVO FLUXO (guest checkout):
 * - Cria usuário no auth.users
 * - Cria profile
 * - Marca convite como completed
 * - Envia email de boas-vindas
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Webhook] Checkout completed:', session.id)

  const invitationToken = session.metadata?.invitation_token
  const studentEmail = session.metadata?.student_email
  const studentName = session.metadata?.student_name
  const studentPhone = session.metadata?.student_phone
  const coachId = session.metadata?.coach_id

  // NOVO FLUXO: Criar usuário se veio de um convite (guest checkout)
  if (invitationToken && studentEmail && studentName && !session.metadata?.student_id) {
    console.log('[Webhook] Guest checkout detected, creating user for:', studentEmail)

    try {
      // 1. Verificar se usuário já existe
      const { data: existingAuth } = await supabase.auth.admin.listUsers()
      const userExists = existingAuth.users.find(u => u.email === studentEmail)

      let userId: string

      if (userExists) {
        console.log('[Webhook] User already exists in auth:', userExists.id)
        userId = userExists.id

        // Verificar se profile existe
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

        if (!existingProfile) {
          // Criar profile para usuário órfão
          console.log('[Webhook] Creating profile for existing auth user')
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: studentEmail,
              full_name: studentName,
              phone: studentPhone || null,
              role: 'aluno',
              coach_id: coachId,
              first_access_completed: true, // Alunos do novo sistema não precisam de código
            })

          if (profileError) {
            console.error('[Webhook] Error creating profile:', profileError)
          }
        }
      } else {
        // 2. Criar usuário novo no auth
        console.log('[Webhook] Creating new user in auth')
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: studentEmail,
          email_confirm: true, // Confirma email automaticamente
          user_metadata: {
            full_name: studentName,
            role: 'aluno',
          },
        })

        if (authError || !newUser.user) {
          console.error('[Webhook] Error creating user:', authError)
          return
        }

        userId = newUser.user.id
        console.log('[Webhook] User created:', userId)

        // 3. Criar profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: studentEmail,
            full_name: studentName,
            phone: studentPhone || null,
            role: 'aluno',
            coach_id: coachId,
            first_access_completed: true, // Alunos do novo sistema não precisam de código
          })

        if (profileError) {
          console.error('[Webhook] Error creating profile:', profileError)
          return
        }

        console.log('[Webhook] Profile created')

        // 4. Buscar informações do coach
        const { data: coachProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', coachId)
          .single()

        const coachName = coachProfile?.full_name || 'seu coach'

        // 5. Gerar token de reset password via Supabase
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: studentEmail,
          options: {
            redirect_to: `${APP_URL}/redefinir-senha`,
          },
        })

        if (resetError || !resetData.properties?.action_link) {
          console.error('[Webhook] Error generating reset link:', resetError)
        } else {
          console.log('[Webhook] Reset link generated successfully')

          // 6. Enviar email de boas-vindas via Resend com template customizado
          try {
            await sendWelcomeEmail({
              studentName,
              studentEmail,
              coachName,
              resetPasswordUrl: resetData.properties.action_link,
            })
            console.log('[Webhook] Welcome email sent via Resend to:', studentEmail)
          } catch (emailError) {
            console.error('[Webhook] Error sending welcome email via Resend:', emailError)
          }
        }
      }

      // 5. Marcar convite como completed
      const { error: inviteError } = await supabase
        .from('payment_invitations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          student_id: userId,
        })
        .eq('token', invitationToken)

      if (inviteError) {
        console.error('[Webhook] Error updating invitation:', inviteError)
      } else {
        console.log('[Webhook] Invitation marked as completed')
      }

      // 6. Atualizar metadata da session para incluir student_id
      // (para processar a subscription corretamente)
      session.metadata = {
        ...session.metadata,
        student_id: userId,
      }

    } catch (error) {
      console.error('[Webhook] Error in guest checkout flow:', error)
    }
  }

  const studentId = session.metadata?.student_id

  if (!coachId || !studentId) {
    console.log('[Webhook] Missing metadata in checkout session after processing')
    return
  }

  const { data: coachAccount, error: coachAccountError } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', coachId)
    .single()

  if (coachAccountError || !coachAccount?.stripe_account_id) {
    console.error('[Webhook] Coach Stripe account not found:', coachAccountError)
    return
  }

  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    console.log('[Webhook] No subscription in checkout session')
    return
  }

  // Garantir que a subscription tenha os metadados obrigatórios e acionar o fluxo de sincronização
  try {
    const metadataPayload: Record<string, string> = {
      coach_id: coachId,
      student_id: studentId,
    }

    if (session.metadata?.student_email) {
      metadataPayload.student_email = session.metadata.student_email
    }

    if (session.metadata?.invitation_token) {
      metadataPayload.invitation_token = session.metadata.invitation_token
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        metadata: metadataPayload,
      },
      {
        stripeAccount: coachAccount.stripe_account_id,
      }
    )

    // Processar imediatamente a subscription para garantir que o banco fique em sincronia
    await handleSubscriptionUpdate(updatedSubscription)
  } catch (error) {
    console.error('[Webhook] Error updating subscription metadata:', error)
  }
}

/**
 * Handle customer.subscription.created and customer.subscription.updated
 * Criar ou atualizar subscription no banco
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('[Webhook] Subscription update:', subscription.id, subscription.status)

  // Buscar registro existente para fallback de metadata
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, coach_id, aluno_id, status, current_period_end')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  const coachId = (subscription.metadata.coach_id as string) || existing?.coach_id
  const studentId = (subscription.metadata.student_id as string) || existing?.aluno_id

  if (!coachId || !studentId) {
    console.log('[Webhook] Missing metadata in subscription and no local record found')
    return
  }

  const previousStatus = existing?.status || null

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

  const newStatus = subscription.status as string
  const statusChangedToCanceled =
    ['canceled', 'unpaid'].includes(newStatus) &&
    !['canceled', 'unpaid'].includes((previousStatus as string) || '')

  if (statusChangedToCanceled) {
    await notifySubscriptionCancellation(coachId, studentId, subscriptionData.current_period_end)
  }

  if (['canceled', 'unpaid'].includes(newStatus)) {
    await deactivateCoachStudent(coachId, studentId)
  }
}

/**
 * Handle customer.subscription.deleted
 * Marcar subscription como cancelada
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Webhook] Subscription deleted:', subscription.id)

  const { data: existing, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, coach_id, aluno_id, status')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (fetchError) {
    console.error('[Webhook] Error fetching subscription to cancel:', fetchError)
    return
  }

  if (!existing) {
    console.log('[Webhook] Subscription not found locally for cancelation')
    return
  }

  const alreadyCanceled = existing.status === 'canceled'

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    console.error('[Webhook] Error updating subscription to canceled:', error)
  } else {
    console.log('[Webhook] Subscription marked as canceled')
    await deactivateCoachStudent(existing.coach_id, existing.aluno_id)
    if (!alreadyCanceled) {
      await notifySubscriptionCancellation(
        existing.coach_id,
        existing.aluno_id,
        subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date().toISOString()
      )
    }
  }
}

async function deactivateCoachStudent(coachId: string | null | undefined, studentId: string | null | undefined) {
  if (!coachId || !studentId) return

  const { error } = await supabase
    .from('coach_students')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('coach_id', coachId)
    .eq('student_id', studentId)

  if (error) {
    console.error('[Webhook] Error updating coach_students status:', error)
  } else {
    console.log('[Webhook] coach_students status updated to inactive')
  }
}

async function fetchCoachStudentProfiles(coachId: string, studentId: string) {
  const [{ data: student }, { data: coach }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', studentId)
      .single(),
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', coachId)
      .single(),
  ])

  return { student, coach }
}

async function notifySubscriptionCancellation(coachId: string, studentId: string, effectiveDate: string) {
  try {
    const { student, coach } = await fetchCoachStudentProfiles(coachId, studentId)
    if (!student?.email) return
    await sendSubscriptionCanceledEmail({
      studentName: student.full_name || student.email,
      studentEmail: student.email,
      coachName: coach?.full_name || coach?.email || 'seu coach',
      effectiveDate,
    })
  } catch (error) {
    console.error('[Webhook] Error sending cancellation email:', error)
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
    try {
      const { student, coach } = await fetchCoachStudentProfiles(subscription.coach_id, subscription.aluno_id)
      if (student?.email) {
        await sendPaymentConfirmationEmail({
          studentName: student.full_name || student.email,
          studentEmail: student.email,
          coachName: coach?.full_name || coach?.email || 'seu coach',
          amount: invoice.total,
          interval: subscription.interval,
        })
      }
    } catch (notificationError) {
      console.error('[Webhook] Error sending payment confirmation email:', notificationError)
    }
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

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('[Webhook] Charge refunded:', charge.id, 'amount_refunded:', charge.amount_refunded)

  const invoiceId =
    typeof charge.invoice === 'string'
      ? charge.invoice
      : charge.invoice?.id

  const now = new Date().toISOString()
  let paymentRecord: { id: string; metadata: any; coach_id: string; aluno_id: string } | null = null

  if (invoiceId) {
    const { data } = await supabase
      .from('payments')
      .select('id, metadata, coach_id, aluno_id')
      .eq('stripe_invoice_id', invoiceId)
      .maybeSingle()
    paymentRecord = data
  }

  if (!paymentRecord && charge.payment_intent) {
    const { data } = await supabase
      .from('payments')
      .select('id, metadata, coach_id, aluno_id')
      .eq('stripe_payment_intent_id', charge.payment_intent as string)
      .maybeSingle()
    paymentRecord = data
  }

  if (!paymentRecord) {
    const { data } = await supabase
      .from('payments')
      .select('id, metadata, coach_id, aluno_id')
      .eq('stripe_charge_id', charge.id)
      .maybeSingle()
    paymentRecord = data
  }

  if (!paymentRecord) {
    console.log('[Webhook] Payment record not found for refunded charge')
  } else {
    const refundAmount = charge.amount_refunded || charge.amount || 0

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded: true,
        refund_amount: refundAmount,
        refunded_at: now,
        updated_at: now,
      })
      .eq('id', paymentRecord.id)

    if (paymentError) {
      console.error('[Webhook] Error updating payment as refunded:', paymentError)
    } else {
      console.log('[Webhook] Payment marked as refunded')
    }
  }

  let subscriptionRecordId = paymentRecord?.metadata?.subscription_id as string | undefined
  let subscriptionRecord:
    | { id: string; coach_id: string; aluno_id: string }
    | null = null

  if (subscriptionRecordId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, coach_id, aluno_id')
      .eq('id', subscriptionRecordId)
      .maybeSingle()
    subscriptionRecord = data
  }

  if (!subscriptionRecord) {
    const stripeSubscriptionId =
      typeof charge.subscription === 'string'
        ? charge.subscription
        : undefined

    if (stripeSubscriptionId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('id, coach_id, aluno_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .maybeSingle()
      subscriptionRecord = data
    }
  }

  if (!subscriptionRecord) {
    console.log('[Webhook] Subscription not found for refunded charge')
    return
  }

  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      canceled_at: now,
      current_period_end: now,
      updated_at: now,
      cancellation_reason: 'refunded',
    })
    .eq('id', subscriptionRecord.id)

  if (subscriptionError) {
    console.error('[Webhook] Error canceling subscription after refund:', subscriptionError)
  } else {
    console.log('[Webhook] Subscription canceled due to refund')
    await deactivateCoachStudent(subscriptionRecord.coach_id, subscriptionRecord.aluno_id)
    try {
      const { student, coach } = await fetchCoachStudentProfiles(subscriptionRecord.coach_id, subscriptionRecord.aluno_id)
      if (student?.email) {
        await sendRefundEmail({
          studentName: student.full_name || student.email,
          studentEmail: student.email,
          coachName: coach?.full_name || coach?.email || 'seu coach',
          amount: refundAmount,
          reason: charge.reason || charge.description || null,
        })
      }
    } catch (notificationError) {
      console.error('[Webhook] Error sending refund email:', notificationError)
    }
  }
}
