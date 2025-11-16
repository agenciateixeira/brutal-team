import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Criar convite de pagamento para aluno
 * POST /api/coach/create-payment-invitation
 *
 * Body:
 * {
 *   studentName: string,
 *   studentEmail: string,
 *   studentPhone?: string,
 *   amount: number, // em centavos, ex: 30000 = R$ 300,00
 *   interval: 'month' | 'week' | 'year',
 *   dueDay?: number, // dia do vencimento (1-28)
 *   trialDays?: number,
 *   description?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   invitation: { id, token, link, ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const {
      studentName,
      studentEmail,
      studentPhone,
      amount,
      interval = 'month',
      dueDay,
      trialDays = 0,
      description,
    } = await req.json()

    // Validações
    if (!studentName || !studentEmail || !amount) {
      return NextResponse.json(
        { error: 'Nome, email e valor são obrigatórios' },
        { status: 400 }
      )
    }

    if (amount < 500) {
      // Mínimo R$ 5,00
      return NextResponse.json({ error: 'Valor mínimo é R$ 5,00' }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    console.log('[Create Payment Invitation] Criando convite:', {
      coach_id: user.id,
      studentName,
      studentEmail,
      amount,
    })

    // Verificar se coach tem conta Stripe habilitada
    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_charges_enabled, full_name')
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

    // Verificar se já existe convite pendente para este email
    const { data: existingInvitation } = await supabase
      .from('payment_invitations')
      .select('id, token, status')
      .eq('coach_id', user.id)
      .eq('student_email', studentEmail)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      // Retornar convite existente
      const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/${existingInvitation.token}`

      return NextResponse.json({
        success: true,
        existing: true,
        message: 'Já existe um convite pendente para este email',
        invitation: {
          id: existingInvitation.id,
          token: existingInvitation.token,
          link: paymentLink,
        },
      })
    }

    // Criar novo convite
    const { data: invitation, error: invitationError } = await supabase
      .from('payment_invitations')
      .insert({
        coach_id: user.id,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone,
        amount,
        interval,
        due_day: dueDay,
        trial_days: trialDays,
        description: description || `Assinatura com ${coachProfile.full_name}`,
        status: 'pending',
      })
      .select()
      .single()

    if (invitationError) {
      console.error('[Create Payment Invitation] Erro ao criar convite:', invitationError)
      return NextResponse.json(
        { error: 'Erro ao criar convite de pagamento' },
        { status: 500 }
      )
    }

    // Gerar link de pagamento
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/${invitation.token}`

    // Gerar mensagem para WhatsApp
    const whatsappMessage = encodeURIComponent(
      `Olá ${studentName}! 👋\n\n` +
      `Você foi convidado(a) para fazer parte do meu time de coaching.\n\n` +
      `💰 Valor: R$ ${(amount / 100).toFixed(2).replace('.', ',')}\n` +
      `📅 Cobrança: ${interval === 'month' ? 'Mensal' : interval === 'week' ? 'Semanal' : 'Anual'}\n\n` +
      `Para começar, é só clicar no link abaixo e completar seu cadastro:\n` +
      `${paymentLink}\n\n` +
      `Qualquer dúvida, estou à disposição! 💪`
    )

    const whatsappLink = studentPhone
      ? `https://wa.me/55${studentPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
      : `https://wa.me/?text=${whatsappMessage}`

    console.log('[Create Payment Invitation] Convite criado:', invitation.id)

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        link: paymentLink,
        whatsappLink,
        expiresAt: invitation.expires_at,
      },
      message: 'Convite criado com sucesso!',
    })
  } catch (error: any) {
    console.error('[Create Payment Invitation] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar convite',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
