import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { alunoId, paymentDueDay, monthlyFee, coachId } = await request.json();

    // Validação
    if (!alunoId || !paymentDueDay || !monthlyFee || !coachId) {
      return NextResponse.json(
        { error: 'Parâmetros faltando' },
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

    // Atualizar o perfil do aluno com permissões de admin
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        approved: true,
        approved_by: coachId,
        approved_at: now,
        payment_due_day: paymentDueDay,
        monthly_fee: parseFloat(monthlyFee),
        last_payment_date: now.split('T')[0],
        payment_status: 'active',
      })
      .eq('id', alunoId)
      .select();

    if (error) {
      console.error('Erro ao aprovar aluno:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Aluno aprovado com sucesso:', data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro na API de aprovação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
