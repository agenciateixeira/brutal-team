import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { alunoId } = await request.json();

    // Validação
    if (!alunoId) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    // Usar service role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date().toISOString();

    // 1. Ativar código de acesso
    const { error: codeError } = await supabaseAdmin
      .from('access_codes')
      .update({
        is_active: true,
        updated_at: now,
      })
      .eq('aluno_id', alunoId);

    if (codeError) {
      console.error('Erro ao ativar código:', codeError);
      return NextResponse.json(
        { error: codeError.message },
        { status: 500 }
      );
    }

    // 2. Confirmar pagamento no plano
    const { error: planError } = await supabaseAdmin
      .from('student_plans')
      .update({
        payment_confirmed: true,
        payment_confirmed_at: now,
        updated_at: now,
      })
      .eq('aluno_id', alunoId)
      .eq('is_active', true);

    if (planError) {
      console.error('Erro ao confirmar pagamento:', planError);
      return NextResponse.json(
        { error: planError.message },
        { status: 500 }
      );
    }

    console.log('Pagamento confirmado e código ativado para aluno:', alunoId);

    return NextResponse.json({
      success: true,
      message: 'Pagamento confirmado e código ativado'
    });
  } catch (error: any) {
    console.error('Erro na API de confirmação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
