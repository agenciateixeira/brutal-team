import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createRouteClient();

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Criar cliente Supabase com service role para bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('🗑️ Iniciando exclusão da conta:', userId);

    // Deletar dados relacionados (em ordem devido a foreign keys)

    // 1. Deletar notificações
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notificationsError) {
      console.error('Erro ao deletar notifications:', notificationsError);
    }

    // 2. Deletar mensagens (sistema de mensagens)
    const { error: messagesError } = await supabaseAdmin
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},aluno_id.eq.${userId}`);

    if (messagesError) {
      console.error('Erro ao deletar messages:', messagesError);
    }

    // 3. Deletar fotos de progresso
    const { error: photosError } = await supabaseAdmin
      .from('progress_photos')
      .delete()
      .eq('aluno_id', userId);

    if (photosError) {
      console.error('Erro ao deletar progress_photos:', photosError);
    }

    // 4. Deletar lembretes de pagamento
    const { error: remindersError } = await supabaseAdmin
      .from('payment_reminders')
      .delete()
      .eq('aluno_id', userId);

    if (remindersError) {
      console.error('Erro ao deletar payment_reminders:', remindersError);
    }

    // 5. Deletar mensagens do chat
    const { error: chatError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (chatError) {
      console.error('Erro ao deletar chat_messages:', chatError);
    }

    // 6. Deletar tracking de refeições
    const { error: mealTrackingError } = await supabaseAdmin
      .from('meal_tracking')
      .delete()
      .eq('aluno_id', userId);

    if (mealTrackingError) {
      console.error('Erro ao deletar meal_tracking:', mealTrackingError);
    }

    // 7. Deletar tracking de treinos
    const { error: workoutTrackingError } = await supabaseAdmin
      .from('workout_tracking')
      .delete()
      .eq('aluno_id', userId);

    if (workoutTrackingError) {
      console.error('Erro ao deletar workout_tracking:', workoutTrackingError);
    }

    // 8. Deletar resumos semanais
    const { error: resumosError } = await supabaseAdmin
      .from('resumos_semanais')
      .delete()
      .eq('aluno_id', userId);

    if (resumosError) {
      console.error('Erro ao deletar resumos_semanais:', resumosError);
    }

    // 9. Deletar dietas
    const { error: dietasError } = await supabaseAdmin
      .from('dietas')
      .delete()
      .eq('aluno_id', userId);

    if (dietasError) {
      console.error('Erro ao deletar dietas:', dietasError);
    }

    // 10. Deletar treinos
    const { error: treinosError } = await supabaseAdmin
      .from('treinos')
      .delete()
      .eq('aluno_id', userId);

    if (treinosError) {
      console.error('Erro ao deletar treinos:', treinosError);
    }

    // 11. Deletar protocolos hormonais
    const { error: protocolosError } = await supabaseAdmin
      .from('protocolos_hormonais')
      .delete()
      .eq('aluno_id', userId);

    if (protocolosError) {
      console.error('Erro ao deletar protocolos_hormonais:', protocolosError);
    }

    // 12. Deletar solicitações de acesso (como aluno ou coach)
    const { error: solicitacoesAlunoError } = await supabaseAdmin
      .from('solicitacoes_acesso')
      .delete()
      .eq('aluno_id', userId);

    if (solicitacoesAlunoError) {
      console.error('Erro ao deletar solicitacoes_acesso (aluno):', solicitacoesAlunoError);
    }

    const { error: solicitacoesCoachError } = await supabaseAdmin
      .from('solicitacoes_acesso')
      .delete()
      .eq('coach_id', userId);

    if (solicitacoesCoachError) {
      console.error('Erro ao deletar solicitacoes_acesso (coach):', solicitacoesCoachError);
    }

    // 13. Deletar histórico de pagamentos
    const { error: paymentHistoryError } = await supabaseAdmin
      .from('payment_history')
      .delete()
      .eq('aluno_id', userId);

    if (paymentHistoryError) {
      console.error('Erro ao deletar payment_history:', paymentHistoryError);
    }

    // 14. Deletar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Erro ao deletar profile:', profileError);
      return NextResponse.json(
        { error: 'Erro ao deletar perfil: ' + profileError.message },
        { status: 500 }
      );
    }

    // 15. Deletar usuário do Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Erro ao deletar usuário do auth:', authError);
      return NextResponse.json(
        { error: 'Erro ao deletar usuário: ' + authError.message },
        { status: 500 }
      );
    }

    console.log('✅ Conta excluída com sucesso:', userId);

    return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir conta:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir conta' },
      { status: 500 }
    );
  }
}
