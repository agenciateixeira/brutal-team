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
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'coach') {
      return NextResponse.json(
        { error: 'Apenas coaches podem cadastrar dados bancários' },
        { status: 403 }
      )
    }

    let accountId = profile?.stripe_account_id

    // Se não tem conta Stripe Connect, criar uma
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', // Express para facilitar onboarding
        country: 'BR',
        email: profile?.email || user.email,
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

      // Atualizar profile com account_id
      await supabase
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', user.id)
    }

    // Criar AccountLink para onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/coach/dados-bancarios`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/coach/dados-bancarios?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
    })
  } catch (error: any) {
    console.error('[create-connect-onboarding] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar onboarding' },
      { status: 500 }
    )
  }
}
