import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, fullName, phone } = body

    // Validações
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, senha e nome completo são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    console.log('[Cadastro Coach] Iniciando cadastro:', email)

    // Criar usuário no Supabase
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'coach',
        },
      },
    })

    if (authError) {
      console.error('[Cadastro Coach] Erro ao criar usuário:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    console.log('[Cadastro Coach] Usuário criado:', authData.user.id)

    // Criar conta Stripe Connect
    try {
      console.log('[Cadastro Coach] Criando conta Stripe Connect...')

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          coach_id: authData.user.id,
          coach_name: fullName,
        },
      })

      console.log('[Cadastro Coach] Conta Stripe criada:', account.id)

      // Atualizar perfil com stripe_account_id e phone
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_account_id: account.id,
          phone: phone || null,
          role: 'coach',
          approved: true, // Coaches são aprovados automaticamente
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('[Cadastro Coach] Erro ao atualizar perfil:', updateError)
        // Não falhar o cadastro por causa disso, apenas logar
      } else {
        console.log('[Cadastro Coach] Perfil atualizado com Stripe account ID')
      }

      return NextResponse.json({
        success: true,
        userId: authData.user.id,
        stripeAccountId: account.id,
        message: 'Coach cadastrado com sucesso! Complete os dados bancários para começar a receber pagamentos.',
      })

    } catch (stripeError: any) {
      console.error('[Cadastro Coach] Erro ao criar conta Stripe:', stripeError)

      // Conta criada mas Stripe falhou - ainda retorna sucesso mas sem Stripe
      return NextResponse.json({
        success: true,
        userId: authData.user.id,
        stripeAccountId: null,
        warning: 'Conta criada, mas será necessário configurar pagamentos depois.',
      })
    }

  } catch (error: any) {
    console.error('[Cadastro Coach] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
