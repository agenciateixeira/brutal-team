import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é coach
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'coach') {
      return NextResponse.json(
        { error: 'Apenas coaches podem criar convites' },
        { status: 403 }
      )
    }

    const { alunoEmail, alunoName, paymentDueDay } = await req.json()

    // Validar dia de vencimento
    if (
      !paymentDueDay ||
      paymentDueDay < 1 ||
      paymentDueDay > 28
    ) {
      return NextResponse.json(
        { error: 'Dia de vencimento deve estar entre 1 e 28' },
        { status: 400 }
      )
    }

    // Gerar token único
    const token = nanoid(32)

    // Data de expiração: 7 dias
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Criar o convite
    const { data: invite, error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        coach_id: user.id,
        aluno_email: alunoEmail || null,
        aluno_name: alunoName || null,
        payment_due_day: paymentDueDay,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar convite:', insertError)
      throw insertError
    }

    return NextResponse.json({
      success: true,
      token,
      invite,
    })
  } catch (error: any) {
    console.error('[create-invite] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar convite' },
      { status: 500 }
    )
  }
}
