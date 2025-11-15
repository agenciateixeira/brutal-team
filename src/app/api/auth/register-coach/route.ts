import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente com service_role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, cpf } = await req.json()

    // Validações
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          phone,
          cpf,
        },
      })

    if (authError) {
      console.error('Erro ao criar usuário:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário')
    }

    // 2. Aguardar trigger criar o profile
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 3. Atualizar profile para role coach
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'coach',
        full_name: name,
        phone,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Erro ao atualizar profile:', updateError)
      // Não bloquear se der erro
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
    })
  } catch (error: any) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao criar conta',
      },
      { status: 500 }
    )
  }
}
