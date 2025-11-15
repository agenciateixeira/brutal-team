import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import AlunosList from '@/components/coach/AlunosList';

// Forçar revalidação em cada request (sem cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoachAlunosPage() {
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

  // Buscar todos os alunos APENAS deste coach
  const { data: alunos } = await supabase
    .from('profiles')
    .select(`
      *,
      progress_photos(count),
      messages!messages_aluno_id_fkey(count)
    `)
    .eq('role', 'aluno')
    .eq('coach_id', session.user.id) // ✅ FILTRO CRÍTICO: apenas alunos deste coach
    .order('created_at', { ascending: false });

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

  // Buscar última atividade de cada aluno (última foto ou mensagem)
  const alunosWithData = await Promise.all(
    (alunos || []).map(async (aluno) => {
      // Buscar última foto
      const { data: lastPhoto } = await supabase
        .from('progress_photos')
        .select('created_at')
        .eq('aluno_id', aluno.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Buscar última mensagem do aluno
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('aluno_id', aluno.id)
        .eq('sender_id', aluno.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Determinar última atividade
      const lastPhotoDate = lastPhoto ? new Date(lastPhoto.created_at).getTime() : 0;
      const lastMessageDate = lastMessage ? new Date(lastMessage.created_at).getTime() : 0;
      const lastActivity = Math.max(lastPhotoDate, lastMessageDate);

      // Verificar se tem atualizações não visualizadas (fotos ou mensagens não lidas)
      const hasUnviewedUpdates = (unreadByAluno?.[aluno.id] || 0) > 0;

      // Verificar se tem dieta ativa
      const { data: activeDiet } = await supabase
        .from('dietas')
        .select('id')
        .eq('aluno_id', aluno.id)
        .eq('active', true)
        .maybeSingle();

      // Verificar se tem treino ativo
      const { data: activeWorkout } = await supabase
        .from('treinos')
        .select('id')
        .eq('aluno_id', aluno.id)
        .eq('active', true)
        .maybeSingle();

      // Buscar informações de indicação
      let referralInfo = null;
      if (aluno.referred_by) {
        // Buscar quem indicou
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id, full_name, email, referral_code')
          .eq('referral_code', aluno.referred_by)
          .maybeSingle();

        // Buscar status da indicação
        const { data: referralData } = await supabase
          .from('referrals')
          .select('id, status, created_at')
          .eq('referred_id', aluno.id)
          .maybeSingle();

        if (referrer) {
          referralInfo = {
            referrer_name: referrer.full_name || referrer.email,
            referrer_id: referrer.id,
            referral_code: referrer.referral_code,
            status: referralData?.status || 'pending',
            referral_id: referralData?.id,
            created_at: referralData?.created_at,
          };
        }
      }

      return {
        ...aluno,
        unread_messages_count: unreadByAluno?.[aluno.id] || 0,
        last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
        has_unviewed_updates: hasUnviewedUpdates,
        has_diet: !!activeDiet,
        has_workout: !!activeWorkout,
        referral_info: referralInfo,
      };
    })
  );

  const alunosWithUnread = alunosWithData;

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Alunos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Lista completa de todos os seus alunos cadastrados
          </p>
        </div>

        {/* Lista de Alunos */}
        <AlunosList alunos={alunosWithUnread || []} />
      </div>
    </AppLayout>
  );
}
