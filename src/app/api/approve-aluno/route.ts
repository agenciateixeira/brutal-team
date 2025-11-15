import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { alunoId, paymentDueDay, monthlyFee, totalValue, planType, coachId } = await request.json();

    // Validação
    if (!alunoId || !paymentDueDay || !monthlyFee || !totalValue || !planType || !coachId) {
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

    const now = new Date();
    const startDate = now.toISOString().split('T')[0];

    // Calcular data de fim baseado no tipo de plano
    let endDate = new Date(now);
    if (planType === 'mensal') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'semestral') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (planType === 'anual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Calcular próxima data de vencimento
    const nextDueDate = new Date(now);
    nextDueDate.setDate(paymentDueDay);
    if (nextDueDate <= now) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    // 1. Atualizar o perfil do aluno
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        approved: true,
        approved_by: coachId,
        approved_at: now.toISOString(),
      })
      .eq('id', alunoId);

    if (profileError) {
      console.error('Erro ao aprovar aluno:', profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // 2. Criar plano do aluno
    const { error: planError } = await supabaseAdmin
      .from('student_plans')
      .insert({
        aluno_id: alunoId,
        plan_type: planType,
        monthly_value: parseFloat(monthlyFee),
        total_value: parseFloat(totalValue),
        start_date: startDate,
        due_day: paymentDueDay,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        payment_confirmed: false,
      });

    if (planError) {
      console.error('Erro ao criar plano:', planError);
      return NextResponse.json(
        { error: planError.message },
        { status: 500 }
      );
    }

    // 3. Buscar o código de acesso gerado automaticamente pelo trigger
    const { data: accessCodeData, error: codeError } = await supabaseAdmin
      .from('access_codes')
      .select('code')
      .eq('aluno_id', alunoId)
      .single();

    if (codeError || !accessCodeData) {
      console.error('Erro ao buscar código:', codeError);
      return NextResponse.json(
        { error: 'Código de acesso não foi gerado' },
        { status: 500 }
      );
    }

    console.log('Aluno aprovado com sucesso, código:', accessCodeData.code);

    return NextResponse.json({
      success: true,
      accessCode: accessCodeData.code
    });
  } catch (error: any) {
    console.error('Erro na API de aprovação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
