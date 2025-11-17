import { createServerClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import AlunosList from '@/components/coach/AlunosList';
import CoachKPIs from '@/components/coach/CoachKPIs';
import WeeklySummaryReview from '@/components/coach/WeeklySummaryReview';

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

  // Buscar alunos APENAS deste coach através da tabela coach_students
  const { data: coachStudentsData } = await supabase
    .from('coach_students')
    .select(`
      student_id,
      status
    `)
    .eq('coach_id', session.user.id)
    .eq('status', 'active');

  // Extrair IDs dos alunos
  const alunoIds = coachStudentsData?.map((cs: any) => cs.student_id) || [];

  // Buscar dados completos dos alunos se houver IDs
  let alunos: any[] = [];
  if (alunoIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        progress_photos(count),
        messages!messages_aluno_id_fkey(count)
      `)
      .in('id', alunoIds)
      .order('created_at', { ascending: false });

    alunos = data || [];
  }

  const supabaseAdmin = createAdminSupabaseClient();
  const alunoEmailsNormalized =
    (alunos || [])
      .map(aluno => aluno.email?.trim().toLowerCase())
      .filter((email): email is string => !!email);

  const anamneseByEmail = new Map<string, boolean>();

  if (supabaseAdmin && alunoEmailsNormalized.length > 0) {
    const { data: anamneseRows, error: adminAnamneseError } = await supabaseAdmin
      .from('anamnese_responses')
      .select('temp_email')
      .in('temp_email', alunoEmailsNormalized)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (adminAnamneseError) {
      console.error('Erro (admin) ao buscar anamneses completas:', adminAnamneseError);
    } else {
      for (const row of anamneseRows || []) {
        const key = row.temp_email?.trim().toLowerCase();
        if (key && !anamneseByEmail.has(key)) {
          anamneseByEmail.set(key, true);
        }
      }
    }
  } else if (alunoEmailsNormalized.length > 0) {
    const { data: anamneseRows, error: anamneseFetchError } = await supabase
      .from('anamnese_responses')
      .select('temp_email')
      .in('temp_email', alunoEmailsNormalized)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (anamneseFetchError) {
      console.error('Erro ao buscar anamneses completas:', anamneseFetchError);
    } else {
      for (const row of anamneseRows || []) {
        const key = row.temp_email?.trim().toLowerCase();
        if (key && !anamneseByEmail.has(key)) {
          anamneseByEmail.set(key, true);
        }
      }
    }
  }

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

  // Buscar última atividade de cada aluno + verificar se tem dieta/treino
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

      // Verificar se tem dieta ativa
      const { data: activeDiet, error: dietError } = await supabase
        .from('dietas')
        .select('id')
        .eq('aluno_id', aluno.id)
        .eq('active', true)
        .maybeSingle();

      if (dietError) {
        console.error('Erro ao buscar dieta ativa:', dietError);
      }

      // Verificar se tem treino ativo
      const { data: activeWorkout, error: workoutError } = await supabase
        .from('treinos')
        .select('id')
        .eq('aluno_id', aluno.id)
        .eq('active', true)
        .maybeSingle();

      if (workoutError) {
        console.error('Erro ao buscar treino ativo:', workoutError);
      }

      const alunoEmailNormalized = aluno.email?.trim().toLowerCase();
      let hasAnamnese = alunoEmailNormalized ? !!anamneseByEmail.get(alunoEmailNormalized) : false;

      if (!hasAnamnese && alunoEmailNormalized && !supabaseAdmin) {
        const { data: anamneseRows, error: anamneseError } = await supabase
          .from('anamnese_responses')
          .select('id')
          .eq('temp_email', alunoEmailNormalized)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (anamneseError) {
          console.error('Erro ao buscar anamnese individual:', anamneseError);
        } else {
          hasAnamnese = !!anamneseRows?.[0];
        }
      }

      return {
        ...aluno,
        unread_messages_count: unreadByAluno?.[aluno.id] || 0,
        last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
        has_unviewed_updates: hasUnviewedUpdates,
        notifications: alunoNotifications,
        has_all_notifications: hasAllNotifications,
        has_diet: !!activeDiet,
        has_workout: !!activeWorkout,
        has_anamnese: hasAnamnese,
      };
    })
  );

  // Todos os alunos com dados (a separação será feita no componente AlunosList)
  const alunosWithUnread = alunosWithData;

  // Extrair IDs dos alunos ativos (com dieta E treino) para os KPIs
  const alunosAtivos = alunosWithData.filter(a => a.has_diet && a.has_workout);
  const alunosIds = alunosAtivos.map(a => a.id);

  // Buscar resumos semanais pendentes e concluídos
  const { data: weeklySummaries } = await supabase
    .from('weekly_summary')
    .select(`
      *,
      profiles!weekly_summary_aluno_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .order('submission_order', { ascending: true });

  // Transformar dados para o componente
  const summariesWithAlunoData = (weeklySummaries || []).map((summary: any) => ({
    ...summary,
    aluno_name: summary.profiles?.full_name || 'Sem nome',
    aluno_photo: summary.profiles?.avatar_url,
  }));

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel do Coach</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visão geral de todos os seus alunos</p>
        </div>

        {/* KPIs do Coach */}
        {alunosIds.length > 0 && (
          <CoachKPIs alunosIds={alunosIds} />
        )}

        {/* Resumos Semanais para Revisão */}
        {summariesWithAlunoData.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Resumos Semanais
            </h2>
            <WeeklySummaryReview summaries={summariesWithAlunoData} />
          </div>
        )}

        {/* Lista de Alunos */}
        <AlunosList alunos={alunosWithUnread || []} />
      </div>
    </AppLayout>
  );
}
