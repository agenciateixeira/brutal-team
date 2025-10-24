import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Verificar se a requisição tem autorização (cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Criar cliente Supabase
    const supabase = createServerClient();

    // Executar função de verificação de status de pagamento
    const { error } = await supabase.rpc('check_payment_status');

    if (error) {
      console.error('Erro ao verificar status de pagamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar status de pagamentos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status de pagamentos verificados com sucesso',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro na rota de verificação de pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error.message },
      { status: 500 }
    );
  }
}

// Permitir POST também (para facilitar testes)
export async function POST(request: Request) {
  return GET(request);
}
