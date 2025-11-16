import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * API: Listar convites de pagamento do coach
 * GET /api/coach/list-payment-invitations
 *
 * Query params:
 * - status?: 'pending' | 'completed' | 'expired' | 'canceled' | 'all'
 *
 * Response:
 * {
 *   invitations: [...],
 *   stats: { total, pending, completed, expired }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'

    console.log('[List Payment Invitations] Listando convites do coach:', user.id, 'status:', status)

    // Buscar convites do coach
    let query = supabase
      .from('payment_invitations')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: invitations, error: invitationsError } = await query

    if (invitationsError) {
      console.error('[List Payment Invitations] Erro ao buscar convites:', invitationsError)
      return NextResponse.json(
        { error: 'Erro ao buscar convites' },
        { status: 500 }
      )
    }

    // Calcular estatísticas
    const stats = {
      total: invitations?.length || 0,
      pending: invitations?.filter(i => i.status === 'pending').length || 0,
      completed: invitations?.filter(i => i.status === 'completed').length || 0,
      expired: invitations?.filter(i => i.status === 'expired').length || 0,
      canceled: invitations?.filter(i => i.status === 'canceled').length || 0,
    }

    // Formatar convites com link
    const formattedInvitations = invitations?.map(invitation => ({
      ...invitation,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/${invitation.token}`,
      whatsappLink: invitation.student_phone
        ? `https://wa.me/55${invitation.student_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
            `Olá ${invitation.student_name}! 👋\n\nVocê foi convidado(a) para fazer parte do meu time de coaching.\n\nPara começar, é só clicar no link:\n${process.env.NEXT_PUBLIC_APP_URL}/pagamento/${invitation.token}`
          )}`
        : null,
    }))

    console.log('[List Payment Invitations] Stats:', stats)

    return NextResponse.json({
      success: true,
      invitations: formattedInvitations || [],
      stats,
    })
  } catch (error: any) {
    console.error('[List Payment Invitations] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao listar convites',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
