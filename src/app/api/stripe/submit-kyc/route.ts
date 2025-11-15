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

    const body = await req.json()
    const {
      accountToken, // Token criado no cliente
      bankCode,
      branchCode,
      accountNumber,
      accountType,
    } = body

    console.log('[Submit KYC] Recebendo Account Token para usuário:', user.id)

    // Buscar perfil do coach para obter stripe_account_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({ error: 'Conta Stripe não encontrada' }, { status: 404 })
    }

    console.log('[Submit KYC] Atualizando conta Stripe:', profile.stripe_account_id)
    console.log('[Submit KYC] Account Token recebido do cliente:', accountToken)

    // 1. Atualizar conta com o token recebido do cliente
    await stripe.accounts.update(profile.stripe_account_id, {
      account_token: accountToken,
      business_profile: {
        mcc: '8299', // Educational Services
        product_description: 'Serviços de coaching e treinamento esportivo',
      },
    })

    console.log('[Submit KYC] Informações pessoais atualizadas via Account Token do cliente')

    // 2. Adicionar conta bancária externa
    const externalAccount = await stripe.accounts.createExternalAccount(
      profile.stripe_account_id,
      {
        external_account: {
          object: 'bank_account',
          country: 'BR',
          currency: 'brl',
          routing_number: `${bankCode}${branchCode}`, // Routing number = bank code + branch
          account_number: accountNumber.replace(/\D/g, ''), // Remover formatação
          account_holder_name: profile.full_name,
          account_holder_type: 'individual',
          account_type: accountType === 'checking' ? 'checking' : 'savings',
        },
      }
    )

    console.log('[Submit KYC] Conta bancária adicionada:', externalAccount.id)

    // 3. Atualizar status no banco de dados
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_account_status: 'kyc_submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Submit KYC] Erro ao atualizar status no banco:', updateError)
    }

    // 4. Verificar status da conta após atualização
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    console.log('[Submit KYC] Status da conta:', {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
    })

    // Atualizar flags de charges e payouts no perfil
    await supabase
      .from('profiles')
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_account_status: account.charges_enabled && account.payouts_enabled
          ? 'active'
          : 'pending_verification',
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      accountId: profile.stripe_account_id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements_pending: account.requirements?.currently_due || [],
      message: account.charges_enabled && account.payouts_enabled
        ? 'KYC concluído com sucesso! Sua conta está ativa.'
        : 'Dados enviados. A Stripe está verificando suas informações.',
    })
  } catch (error: any) {
    console.error('[Submit KYC] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao enviar dados de verificação',
        details: error.raw?.message || error.message,
      },
      { status: 500 }
    )
  }
}
