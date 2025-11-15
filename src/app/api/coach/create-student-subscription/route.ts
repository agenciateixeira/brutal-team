import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Criar assinatura recorrente de aluno para coach
 * POST /api/coach/create-student-subscription
 *
 * Body:
 * {
 *   studentEmail: string,
 *   amount: number, // em centavos, ex: 30000 = R$ 300,00
 *   interval: 'month' | 'week' | 'day' | 'year',
 *   trialDays?: number
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

    const { studentEmail, amount, interval = 'month', trialDays = 0 } = await req.json()

    // Validações
    if (!studentEmail || !amount) {
      return NextResponse.json(
        { error: 'Email do aluno e valor são obrigatórios' },
        { status: 400 }
      )
    }

    if (amount < 500) {
      // Mínimo R$ 5,00
      return NextResponse.json(
        { error: 'Valor mínimo é R$ 5,00' },
        { status: 400 }
      )
    }

    console.log('[Create Student Subscription] Iniciando criação para:', {
      coach_id: user.id,
      studentEmail,
      amount,
      interval,
    })

    // 1. Buscar perfil do coach e verificar conta Stripe
    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_charges_enabled, full_name, email')
      .eq('id', user.id)
      .single()

    if (!coachProfile || !coachProfile.stripe_account_id) {
      return NextResponse.json(
        { error: 'Você precisa configurar sua conta Stripe primeiro' },
        { status: 400 }
      )
    }

    if (!coachProfile.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Sua conta Stripe ainda não está habilitada para receber pagamentos' },
        { status: 400 }
      )
    }

    // 2. Buscar ou criar perfil do aluno
    let { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, full_name, email')
      .eq('email', studentEmail)
      .single()

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'Aluno não encontrado. O aluno precisa estar cadastrado na plataforma.' },
        { status: 404 }
      )
    }

    console.log('[Create Student Subscription] Aluno encontrado:', studentProfile.id)

    // 3. Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, stripe_subscription_id')
      .eq('aluno_id', studentProfile.id)
      .eq('coach_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'Já existe uma assinatura ativa para este aluno',
          subscriptionId: existingSubscription.id,
        },
        { status: 400 }
      )
    }

    // 4. Criar ou obter Customer do aluno no Stripe
    let customerId = studentProfile.stripe_customer_id

    if (!customerId) {
      console.log('[Create Student Subscription] Criando Stripe Customer para aluno')
      const customer = await stripe.customers.create({
        email: studentProfile.email,
        name: studentProfile.full_name || studentProfile.email,
        metadata: {
          user_id: studentProfile.id,
          platform: 'brutal_team',
          role: 'student',
        },
      })

      customerId = customer.id

      // Salvar customer_id no perfil do aluno
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', studentProfile.id)

      console.log('[Create Student Subscription] Customer criado:', customerId)
    }

    // 5. Criar Price no Stripe (conectado à conta do coach)
    console.log('[Create Student Subscription] Criando Price no Stripe')

    // Primeiro criar o Product
    const product = await stripe.products.create(
      {
        name: `Assinatura - ${coachProfile.full_name || 'Coach'}`,
        description: `Assinatura mensal de coaching com ${coachProfile.full_name}`,
        metadata: {
          coach_id: user.id,
          platform: 'brutal_team',
        },
      },
      {
        stripeAccount: coachProfile.stripe_account_id,
      }
    )

    // Depois criar o Price
    const price = await stripe.prices.create(
      {
        product: product.id,
        currency: 'brl',
        recurring: {
          interval: interval as 'month' | 'week' | 'day' | 'year',
          interval_count: 1,
        },
        unit_amount: amount,
        metadata: {
          coach_id: user.id,
          platform: 'brutal_team',
        },
      },
      {
        stripeAccount: coachProfile.stripe_account_id,
      }
    )

    console.log('[Create Student Subscription] Price criado:', price.id)

    // 6. Criar Subscription no Stripe com fee da plataforma
    console.log('[Create Student Subscription] Criando Subscription no Stripe')

    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: price.id }],
      application_fee_percent: 2, // 2% para a plataforma
      metadata: {
        coach_id: user.id,
        student_id: studentProfile.id,
        platform: 'brutal_team',
      },
    }

    // Adicionar trial se especificado
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays
    }

    const subscription = await stripe.subscriptions.create(
      subscriptionData,
      {
        stripeAccount: coachProfile.stripe_account_id,
      }
    )

    console.log('[Create Student Subscription] Subscription criada:', subscription.id)

    // 7. Salvar assinatura no banco de dados
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        aluno_id: studentProfile.id,
        coach_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: price.id,
        amount: amount,
        currency: 'brl',
        interval: interval,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        payment_due_day: new Date(subscription.current_period_end * 1000).getDate(),
        platform_fee_percent: 2.0,
        trial_start: subscription.trial_start
          ? new Date(subscription.trial_start * 1000).toISOString()
          : null,
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        metadata: {
          stripe_product_id: product.id,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Create Student Subscription] Erro ao salvar no banco:', dbError)
      // Tentar cancelar a subscription no Stripe
      try {
        await stripe.subscriptions.cancel(subscription.id, {
          stripeAccount: coachProfile.stripe_account_id,
        })
      } catch (cancelError) {
        console.error('[Create Student Subscription] Erro ao cancelar subscription:', cancelError)
      }
      throw dbError
    }

    console.log('[Create Student Subscription] Assinatura salva no banco:', dbSubscription.id)

    // 8. Criar/atualizar relacionamento coach-student (será feito via trigger SQL)
    // O trigger create_coach_student_on_subscription já faz isso automaticamente

    return NextResponse.json({
      success: true,
      subscription: {
        id: dbSubscription.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        amount: amount,
        interval: interval,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end,
        student: {
          id: studentProfile.id,
          name: studentProfile.full_name,
          email: studentProfile.email,
        },
      },
      message: trialDays > 0
        ? `Assinatura criada com ${trialDays} dias de teste grátis!`
        : 'Assinatura criada com sucesso!',
    })
  } catch (error: any) {
    console.error('[Create Student Subscription] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar assinatura',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
