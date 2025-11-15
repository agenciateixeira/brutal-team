import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

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

    // Verificar se já tem conta Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email, name')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_account_id) {
      return NextResponse.json(
        {
          error: 'Conta Stripe já existe',
          accountId: profile.stripe_account_id,
        },
        { status: 400 }
      )
    }

    // Criar conta conectada (Custom Account)
    const account = await stripe.accounts.create({
      type: 'custom',
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

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar profile:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      status: 'pending',
    })
  } catch (error: any) {
    console.error('Erro ao criar conta Stripe:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar conta Stripe',
      },
      { status: 500 }
    )
  }
}
