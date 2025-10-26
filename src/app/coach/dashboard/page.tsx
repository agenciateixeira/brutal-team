import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import AlunosList from '@/components/coach/AlunosList';
import PendingApprovals from '@/components/coach/PendingApprovals';
import CoachKPIs from '@/components/coach/CoachKPIs';

// Forçar revalidação em cada request (sem cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoachDashboard() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar dados do coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  // Buscar alunos aprovados
  const { data: alunos } = await supabase
    .from('profiles')
    .select(`
      *,
      progress_photos(count),
      messages!messages_aluno_id_fkey(count)
    `)
    .eq('role', 'aluno')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  // Buscar alunos pendentes de aprovação
  const { data: pendingAlunos, error: pendingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  if (pendingError) {
    console.error('Erro ao buscar alunos pendentes:', pendingError);
  }

  console.log('Alunos pendentes encontrados:', pendingAlunos?.length || 0);

  // Buscar mensagens não lidas por aluno
  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('aluno_id, id')
    .eq('read', false)
    .neq('sender_id', session.user.id);

  // Contar mensagens não lidas por aluno
  const unreadByAluno = unreadMessages?.reduce((acc: any, msg) => {
    acc[msg.aluno_id] = (acc[msg.aluno_id] || 0) + 1;
    return acc;
  }, {});

  // Buscar notificações não visualizadas por aluno
  const { data: notifications } = await supabase
    .from('coach_notifications')
    .select('aluno_id, notification_type')
    .eq('coach_id', session.user.id)
    .eq('is_viewed', false);

  // Agrupar notificações por aluno
  const notificationsByAluno = notifications?.reduce((acc: any, notif) => {
    if (!acc[notif.aluno_id]) {
      acc[notif.aluno_id] = { photo: false, message: false, diet: false, workout: false, protocol: false, count: 0 };
    }
    acc[notif.aluno_id][notif.notification_type] = true;
    acc[notif.aluno_id].count++;
    return acc;
  }, {}) || {};

  // Buscar última atividade de cada aluno
  const alunosWithData = await Promise.all(
    (alunos || []).map(async (aluno) => {
      const { data: lastPhoto } = await supabase
        .from('progress_photos')
        .select('created_at')
        .eq('aluno_id', aluno.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: lastMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('aluno_id', aluno.id)
        .eq('sender_id', aluno.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastPhotoDate = lastPhoto ? new Date(lastPhoto.created_at).getTime() : 0;
      const lastMessageDate = lastMessage ? new Date(lastMessage.created_at).getTime() : 0;
      const lastActivity = Math.max(lastPhotoDate, lastMessageDate);

      const hasUnviewedUpdates = (unreadByAluno?.[aluno.id] || 0) > 0;
      const alunoNotifications = notificationsByAluno[aluno.id] || { photo: false, message: false, diet: false, workout: false, protocol: false, count: 0 };

      // Determinar se tem todas as notificações
      const hasAllNotifications = alunoNotifications.photo && alunoNotifications.message &&
                                  alunoNotifications.diet && alunoNotifications.workout &&
                                  alunoNotifications.protocol;

      return {
        ...aluno,
        unread_messages_count: unreadByAluno?.[aluno.id] || 0,
        last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
        has_unviewed_updates: hasUnviewedUpdates,
        notifications: alunoNotifications,
        has_all_notifications: hasAllNotifications,
      };
    })
  );

  const alunosWithUnread = alunosWithData;

  // Extrair IDs dos alunos para os KPIs
  const alunosIds = (alunosWithUnread || []).map(a => a.id);

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel do Coach</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral de todos os seus alunos</p>
        </div>

        {/* Aprovações Pendentes */}
        {pendingAlunos && pendingAlunos.length > 0 && (
          <PendingApprovals pendingAlunos={pendingAlunos} coachId={session.user.id} />
        )}

        {/* KPIs do Coach */}
        {alunosIds.length > 0 && (
          <CoachKPIs alunosIds={alunosIds} />
        )}

        {/* Lista de Alunos */}
        <AlunosList alunos={alunosWithUnread || []} />
      </div>
    </AppLayout>
  );
}
