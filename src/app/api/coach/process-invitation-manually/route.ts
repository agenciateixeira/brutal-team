import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

/**
 * API: Processar convite manualmente (quando webhook falha)
 * POST /api/coach/process-invitation-manually
 *
 * Body:
 * {
 *   invitationToken: string
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

    const { invitationToken } = await req.json()

    if (!invitationToken) {
      return NextResponse.json({ error: 'Token do convite é obrigatório' }, { status: 400 })
    }

    console.log('[Process Invitation] Processing invitation manually:', invitationToken)

    // Usar service_role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar convite
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('payment_invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('coach_id', user.id) // Verifica se pertence ao coach
      .single()

    if (invitationError || !invitation) {
      console.error('[Process Invitation] Invitation not found:', invitationError)
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'Este convite já foi processado' },
        { status: 400 }
      )
    }

    const studentEmail = invitation.student_email
    const studentName = invitation.student_name
    const studentPhone = invitation.student_phone
    const coachId = invitation.coach_id

    // Verificar se usuário já existe
    const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuth.users.find(u => u.email === studentEmail)

    let userId: string

    if (userExists) {
      console.log('[Process Invitation] User already exists in auth:', userExists.id)
      userId = userExists.id

      // Verificar se profile existe
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!existingProfile) {
        // Criar profile para usuário órfão
        console.log('[Process Invitation] Creating profile for existing auth user')
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            email: studentEmail,
            full_name: studentName,
            phone: studentPhone || null,
            role: 'student',
            coach_id: coachId,
          })

        if (profileError) {
          console.error('[Process Invitation] Error creating profile:', profileError)
          return NextResponse.json(
            { error: 'Erro ao criar perfil do aluno' },
            { status: 500 }
          )
        }
      }
    } else {
      // Criar novo usuário
      console.log('[Process Invitation] Creating new user in auth')
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: studentEmail,
        email_confirm: true,
        user_metadata: {
          full_name: studentName,
          role: 'student',
        },
      })

      if (authError || !newUser.user) {
        console.error('[Process Invitation] Error creating user:', authError)
        return NextResponse.json(
          { error: 'Erro ao criar usuário no sistema de autenticação' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
      console.log('[Process Invitation] User created:', userId)

      // Criar profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: studentEmail,
          full_name: studentName,
          phone: studentPhone || null,
          role: 'student',
          coach_id: coachId,
        })

      if (profileError) {
        console.error('[Process Invitation] Error creating profile:', profileError)
        return NextResponse.json(
          { error: 'Erro ao criar perfil do aluno' },
          { status: 500 }
        )
      }

      console.log('[Process Invitation] Profile created')
    }

    // Buscar nome do coach
    const { data: coachProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', coachId)
      .single()

    const coachName = coachProfile?.full_name || 'seu coach'

    // Gerar link de reset password
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: studentEmail,
    })

    if (resetError || !resetData.properties?.action_link) {
      console.error('[Process Invitation] Error generating reset link:', resetError)
    } else {
      console.log('[Process Invitation] Reset link generated successfully')

      // Enviar email de boas-vindas
      try {
        await sendWelcomeEmail({
          studentName,
          studentEmail,
          coachName,
          resetPasswordUrl: resetData.properties.action_link,
        })
        console.log('[Process Invitation] Welcome email sent via Resend to:', studentEmail)
      } catch (emailError) {
        console.error('[Process Invitation] Error sending welcome email:', emailError)
      }
    }

    // Marcar convite como completed
    const { error: updateError } = await supabaseAdmin
      .from('payment_invitations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        student_id: userId,
      })
      .eq('token', invitationToken)

    if (updateError) {
      console.error('[Process Invitation] Error updating invitation:', updateError)
      return NextResponse.json(
        { error: 'Erro ao marcar convite como processado' },
        { status: 500 }
      )
    }

    console.log('[Process Invitation] Invitation marked as completed')

    return NextResponse.json({
      success: true,
      message: 'Convite processado com sucesso! Usuário criado e email enviado.',
      studentId: userId,
      studentEmail,
    })
  } catch (error: any) {
    console.error('[Process Invitation] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar convite',
      },
      { status: 500 }
    )
  }
}
