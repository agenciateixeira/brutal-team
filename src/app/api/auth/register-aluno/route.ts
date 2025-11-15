import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, fullName, inviteToken, referralCode } = body

    console.log('[Register Aluno] Iniciando cadastro:', { email, hasInvite: !!inviteToken, hasReferral: !!referralCode })

    // Validações básicas
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

    const supabase = createRouteClient()

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Validar token de convite se fornecido
    let inviteData = null
    if (inviteToken) {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select(`
          id,
          coach_id,
          payment_due_day,
          expires_at,
          used,
          coach:profiles!invite_tokens_coach_id_fkey(
            full_name,
            email
          )
        `)
        .eq('token', inviteToken.trim())
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Convite não encontrado' },
          { status: 400 }
        )
      }

      if (data.used) {
        return NextResponse.json(
          { error: 'Este convite já foi utilizado' },
          { status: 400 }
        )
      }

      const now = new Date()
      const expiresAt = new Date(data.expires_at)
      if (now > expiresAt) {
        return NextResponse.json(
          { error: 'Este convite expirou' },
          { status: 400 }
        )
      }

      inviteData = data
      console.log('[Register Aluno] Convite válido:', { coachId: data.coach_id })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error('[Register Aluno] Erro ao criar usuário no Auth:', authError)
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

    console.log('[Register Aluno] Usuário criado no Auth:', authData.user.id)

    // Aguardar um pouco para o trigger criar o profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar se o profile foi criado pelo trigger
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!existingProfile) {
      // Se o trigger não criou, criar manualmente
      console.log('[Register Aluno] Criando profile manualmente...')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: 'aluno',
          approved: false,
          coach_id: inviteData?.coach_id || null,
          payment_due_day: inviteData?.payment_due_day || null,
        })

      if (profileError) {
        console.error('[Register Aluno] Erro ao criar profile:', profileError)
        // Não falhar aqui, o profile pode ter sido criado entre a verificação e a inserção
      }
    } else {
      // Profile existe, atualizar com dados do convite se houver
      if (inviteData) {
        console.log('[Register Aluno] Atualizando profile com dados do convite...')

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            coach_id: inviteData.coach_id,
            payment_due_day: inviteData.payment_due_day,
            approved: false,
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('[Register Aluno] Erro ao atualizar profile:', updateError)
        }
      }
    }

    // Processar convite
    if (inviteData && inviteToken) {
      // Marcar token como usado
      const { error: tokenError } = await supabase
        .from('invite_tokens')
        .update({
          used: true,
          used_by: authData.user.id,
          used_at: new Date().toISOString(),
        })
        .eq('token', inviteToken)

      if (tokenError) {
        console.error('[Register Aluno] Erro ao marcar token como usado:', tokenError)
      }

      console.log('[Register Aluno] Token marcado como usado')
    }

    // Processar código de referência se houver
    if (referralCode) {
      try {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.trim().toUpperCase())
          .eq('role', 'aluno')
          .single()

        if (referrerProfile) {
          await supabase.from('referrals').insert({
            referrer_id: referrerProfile.id,
            referred_id: authData.user.id,
            referral_code: referralCode.trim().toUpperCase(),
            referred_email: email,
            referred_name: fullName,
            status: 'pending',
          })

          console.log('[Register Aluno] Referral criado')
        }
      } catch (refError) {
        console.error('[Register Aluno] Erro ao criar referral:', refError)
        // Não falhar o cadastro por causa disso
      }
    }

    console.log('[Register Aluno] Cadastro concluído com sucesso!')

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      message: 'Conta criada com sucesso! Faça login para continuar.',
    })

  } catch (error: any) {
    console.error('[Register Aluno] Erro geral:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
