import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

/**
 * API: Reenviar email de boas-vindas para aluno
 * POST /api/coach/resend-welcome-email
 *
 * Body:
 * {
 *   studentId: string
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

    const { studentId } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 })
    }

    console.log('[Resend Welcome] Coach requesting resend for student:', studentId)

    // Verificar se o coach está logado e se o aluno pertence a ele
    const { data: coachProfile, error: coachError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single()

    if (coachError || !coachProfile || coachProfile.role !== 'coach') {
      return NextResponse.json({ error: 'Apenas coaches podem reenviar emails' }, { status: 403 })
    }

    // Buscar perfil do aluno e verificar se pertence ao coach
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, email, full_name, coach_id, role')
      .eq('id', studentId)
      .single()

    if (studentError || !studentProfile) {
      console.error('[Resend Welcome] Student not found:', studentError)
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    // Verificar se o aluno pertence ao coach logado
    if (studentProfile.coach_id !== user.id) {
      console.error('[Resend Welcome] Student does not belong to coach')
      return NextResponse.json(
        { error: 'Este aluno não pertence a você' },
        { status: 403 }
      )
    }

    // Usar service_role para gerar link de reset
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Gerar token de reset password via Supabase Admin API
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: studentProfile.email,
    })

    if (resetError || !resetData.properties?.action_link) {
      console.error('[Resend Welcome] Error generating reset link:', resetError)
      return NextResponse.json(
        { error: 'Erro ao gerar link de recuperação' },
        { status: 500 }
      )
    }

    console.log('[Resend Welcome] Reset link generated successfully')

    // Enviar email de boas-vindas via Resend
    try {
      await sendWelcomeEmail({
        studentName: studentProfile.full_name || studentProfile.email,
        studentEmail: studentProfile.email,
        coachName: coachProfile.full_name || coachProfile.email,
        resetPasswordUrl: resetData.properties.action_link,
      })

      console.log('[Resend Welcome] Email sent successfully to:', studentProfile.email)

      return NextResponse.json({
        success: true,
        message: 'Email de boas-vindas enviado com sucesso',
        studentEmail: studentProfile.email,
      })
    } catch (emailError: any) {
      console.error('[Resend Welcome] Error sending email:', emailError)
      return NextResponse.json(
        {
          error: 'Erro ao enviar email',
          details: emailError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Resend Welcome] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao reenviar email',
      },
      { status: 500 }
    )
  }
}
