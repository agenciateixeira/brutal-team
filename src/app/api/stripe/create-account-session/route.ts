import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

    // Buscar perfil do coach
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    let accountId = profile.stripe_account_id

    // Se não existe conta Stripe Connect, criar
    if (!accountId) {
      console.log('[Account Session] Criando nova conta Stripe Connect para:', user.id)

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: profile.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id,
          platform: 'brutal_team',
        },
      })

      accountId = account.id

      // Salvar account_id no banco
      await supabase
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', user.id)

      console.log('[Account Session] Conta criada:', accountId)
    }

    // Criar Account Session (para embedded components)
    console.log('[Account Session] Criando session para account:', accountId)

    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: { enabled: true },
        payments: { enabled: true },
        payouts: { enabled: true },
        account_management: { enabled: true },
      },
    })

    console.log('[Account Session] Session criada com sucesso')

    return NextResponse.json({
      clientSecret: accountSession.client_secret,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error('[Account Session] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar sessão de conta',
      },
      { status: 500 }
    )
  }
}
