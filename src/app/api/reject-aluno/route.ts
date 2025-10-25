import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Deletar o perfil do aluno com permissões de admin
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', alunoId);

    if (error) {
      console.error('Erro ao rejeitar aluno:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Aluno rejeitado com sucesso:', alunoId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro na API de rejeição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
