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
      console.log('[Onboarding Link] Criando nova conta Stripe Connect para:', user.id)

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

      console.log('[Onboarding Link] Conta criada:', accountId)
    }

    // Criar Account Link para onboarding
    console.log('[Onboarding Link] Criando link para account:', accountId)

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/cadastro-coach?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/cadastro-coach?kyc=complete`,
      type: 'account_onboarding',
    })

    console.log('[Onboarding Link] Link criado com sucesso')

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error('[Onboarding Link] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar link de onboarding',
      },
      { status: 500 }
    )
  }
}
