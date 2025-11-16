import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPasswordRecoveryEmail } from '@/lib/resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.brutalteam.blog.br'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirect_to: `${APP_URL}/redefinir-senha`,
      },
    })

    if (resetError || !resetData.properties?.action_link) {
      console.error('[Password Recovery] Error generating link:', resetError)
      return NextResponse.json(
        { error: 'Não foi possível gerar o link de recuperação' },
        { status: 500 }
      )
    }

    await sendPasswordRecoveryEmail({
      studentName: profile?.full_name || normalizedEmail,
      studentEmail: normalizedEmail,
      recoveryUrl: resetData.properties.action_link,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Password Recovery] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar email de recuperação' },
      { status: 500 }
    )
  }
}

