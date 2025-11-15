import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: 'Conta Stripe não encontrada' }, { status: 404 })
    }

    // Buscar conta Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    // Buscar contas bancárias externas
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      profile.stripe_account_id,
      { object: 'bank_account', limit: 10 }
    )

    const bankAccount = externalAccounts.data[0] as Stripe.BankAccount | undefined

    return NextResponse.json({
      hasAccount: !!bankAccount,
      bankAccount: bankAccount ? {
        id: bankAccount.id,
        bankName: bankAccount.bank_name,
        last4: bankAccount.last4,
        routingNumber: bankAccount.routing_number,
        accountHolderName: bankAccount.account_holder_name,
      } : null,
      accountStatus: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements_pending: account.requirements?.currently_due || [],
      },
    })

  } catch (error: any) {
    console.error('[Get Bank Account] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao buscar conta bancária',
      },
      { status: 500 }
    )
  }
}
