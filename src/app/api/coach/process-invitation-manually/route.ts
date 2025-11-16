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
      console.error('[Process Invitation] Not authenticated')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { invitationToken } = await req.json()

    if (!invitationToken) {
      console.error('[Process Invitation] Missing invitation token')
      return NextResponse.json({ error: 'Token do convite é obrigatório' }, { status: 400 })
    }

    console.log('[Process Invitation] Processing invitation manually:', invitationToken)
    console.log('[Process Invitation] Coach ID:', user.id)

    // Verificar variáveis de ambiente
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[Process Invitation] NEXT_PUBLIC_SUPABASE_URL not configured')
      return NextResponse.json({ error: 'Configuração do Supabase ausente' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Process Invitation] SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json({ error: 'Chave de administração do Supabase ausente' }, { status: 500 })
    }
    if (!process.env.RESEND_API_KEY) {
      console.error('[Process Invitation] RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Chave da API de email ausente' }, { status: 500 })
    }

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
            role: 'aluno',
            coach_id: coachId,
          })

        if (profileError) {
          console.error('[Process Invitation] Error creating profile:', profileError)
          return NextResponse.json(
            { error: 'Erro ao criar perfil do aluno' },
            { status: 500 }
          )
        }

        // Criar registro coach_students
        const { error: coachStudentError } = await supabaseAdmin
          .from('coach_students')
          .insert({
            coach_id: coachId,
            student_id: userId,
            status: 'active',
          })

        if (coachStudentError) {
          console.error('[Process Invitation] Error creating coach_student for existing user:', coachStudentError)
        } else {
          console.log('[Process Invitation] Coach_student relationship created for existing user')
        }
      } else {
        // Profile já existe, apenas criar coach_students se não existir
        console.log('[Process Invitation] Profile already exists, checking coach_students')
        const { data: existingCoachStudent } = await supabaseAdmin
          .from('coach_students')
          .select('id')
          .eq('coach_id', coachId)
          .eq('student_id', userId)
          .single()

        if (!existingCoachStudent) {
          const { error: coachStudentError } = await supabaseAdmin
            .from('coach_students')
            .insert({
              coach_id: coachId,
              student_id: userId,
              status: 'active',
            })

          if (coachStudentError) {
            console.error('[Process Invitation] Error creating coach_student for existing profile:', coachStudentError)
          } else {
            console.log('[Process Invitation] Coach_student relationship created for existing profile')
          }
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
          role: 'aluno',
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
          role: 'aluno',
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

      // Criar registro coach_students
      const { error: coachStudentError } = await supabaseAdmin
        .from('coach_students')
        .insert({
          coach_id: coachId,
          student_id: userId,
          status: 'active',
        })

      if (coachStudentError) {
        console.error('[Process Invitation] Error creating coach_student:', coachStudentError)
      } else {
        console.log('[Process Invitation] Coach_student relationship created')
      }
    }

    // Buscar nome do coach
    const { data: coachProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', coachId)
      .single()

    const coachName = coachProfile?.full_name || 'seu coach'

    // Gerar link de reset password
    console.log('[Process Invitation] Generating reset link for:', studentEmail)
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: studentEmail,
    })

    if (resetError || !resetData.properties?.action_link) {
      console.error('[Process Invitation] Error generating reset link:', resetError)
      console.error('[Process Invitation] Reset data:', resetData)
      return NextResponse.json(
        { error: 'Erro ao gerar link de recuperação de senha', details: resetError?.message },
        { status: 500 }
      )
    }

    console.log('[Process Invitation] Reset link generated successfully')

    // Enviar email de boas-vindas
    try {
      console.log('[Process Invitation] Sending welcome email to:', studentEmail)
      await sendWelcomeEmail({
        studentName,
        studentEmail,
        coachName,
        resetPasswordUrl: resetData.properties.action_link,
      })
      console.log('[Process Invitation] Welcome email sent via Resend to:', studentEmail)
    } catch (emailError: any) {
      console.error('[Process Invitation] Error sending welcome email:', emailError)
      console.error('[Process Invitation] Email error details:', emailError.message)
      return NextResponse.json(
        { error: 'Erro ao enviar email de boas-vindas', details: emailError.message },
        { status: 500 }
      )
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
    console.error('[Process Invitation] Unexpected error:', error)
    console.error('[Process Invitation] Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar convite',
        details: error.stack,
      },
      { status: 500 }
    )
  }
}
