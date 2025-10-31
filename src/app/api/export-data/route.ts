import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    console.log('📦 Exportando dados do usuário:', userId);

    // Buscar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Buscar dietas
    const { data: dietas } = await supabase
      .from('dietas')
      .select('*')
      .eq('aluno_id', userId)
      .order('created_at', { ascending: false });

    // Buscar treinos
    const { data: treinos } = await supabase
      .from('treinos')
      .select('*')
      .eq('aluno_id', userId)
      .order('created_at', { ascending: false });

    // Buscar protocolos
    const { data: protocolos } = await supabase
      .from('protocolos_hormonais')
      .select('*')
      .eq('aluno_id', userId)
      .order('created_at', { ascending: false });

    // Buscar fotos de progresso
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('aluno_id', userId)
      .order('week_number', { ascending: true });

    // Buscar mensagens
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},aluno_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    // Buscar tracking de refeições
    const { data: mealTracking } = await supabase
      .from('meal_tracking')
      .select('*')
      .eq('aluno_id', userId)
      .order('date', { ascending: false });

    // Buscar tracking de treinos
    const { data: workoutTracking } = await supabase
      .from('workout_tracking')
      .select('*')
      .eq('aluno_id', userId)
      .order('date', { ascending: false });

    // Buscar resumos semanais
    const { data: resumos } = await supabase
      .from('resumos_semanais')
      .select('*')
      .eq('aluno_id', userId)
      .order('week_number', { ascending: false });

    // Buscar histórico de pagamentos
    const { data: paymentHistory } = await supabase
      .from('payment_history')
      .select('*')
      .eq('aluno_id', userId)
      .order('created_at', { ascending: false });

    // Montar objeto com todos os dados
    const exportData = {
      exportadoEm: new Date().toISOString(),
      perfil: profile,
      dietas: dietas || [],
      treinos: treinos || [],
      protocolos: protocolos || [],
      fotosProgresso: photos || [],
      mensagens: messages || [],
      trackingRefeicoes: mealTracking || [],
      trackingTreinos: workoutTracking || [],
      resumosSemanais: resumos || [],
      historicoPagamentos: paymentHistory || [],
    };

    console.log('✅ Dados exportados com sucesso');

    // Retornar como JSON para download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="brutal-team-dados-${userId}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
}
