import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Sincronizar status da conta Stripe do coach com o banco de dados
 * POST /api/coach/sync-stripe-account
 *
 * Busca as informações mais recentes da conta Stripe e atualiza o perfil
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

    // Buscar perfil atual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_account_id, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json(
        { error: 'Conta Stripe não vinculada' },
        { status: 400 }
      )
    }

    console.log('[Sync Stripe Account] Buscando status da conta:', profile.stripe_account_id)

    // Buscar status atual da conta na Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    console.log('[Sync Stripe Account] Status recebido:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements?.currently_due,
    })

    // Atualizar banco de dados com informações mais recentes
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_onboarding_complete: account.charges_enabled && account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Sync Stripe Account] Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    console.log('[Sync Stripe Account] Perfil atualizado com sucesso')

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
        },
      },
      message: account.charges_enabled
        ? 'Conta habilitada para receber pagamentos!'
        : 'Conta ainda não habilitada. Verifique os requisitos pendentes.',
    })
  } catch (error: any) {
    console.error('[Sync Stripe Account] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao sincronizar conta',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
