import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

/**
 * API: Buscar informações de um convite de pagamento
 * GET /api/payment-invitation/[token]
 *
 * Response:
 * {
 *   invitation: {
 *     id, student_name, amount, interval, coach_name, ...
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    console.log('[Payment Invitation] Buscando convite:', token)

    // Buscar convite pelo token
    const { data: invitation, error: invitationError } = await supabase
      .from('payment_invitations')
      .select(`
        *,
        coach:profiles!coach_id(
          id,
          full_name,
          email
        )
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      console.error('[Payment Invitation] Convite não encontrado:', invitationError)
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se convite expirou
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Este convite não está mais disponível',
          status: invitation.status,
        },
        { status: 410 } // 410 Gone
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirado
      await supabase
        .from('payment_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 410 }
      )
    }

    console.log('[Payment Invitation] Convite válido encontrado:', invitation.id)

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        studentName: invitation.student_name,
        studentEmail: invitation.student_email,
        amount: invitation.amount,
        interval: invitation.interval,
        dueDay: invitation.due_day,
        trialDays: invitation.trial_days,
        description: invitation.description,
        expiresAt: invitation.expires_at,
        coach: {
          id: invitation.coach.id,
          name: invitation.coach.full_name,
          email: invitation.coach.email,
        },
      },
    })
  } catch (error: any) {
    console.error('[Payment Invitation] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao buscar convite',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
