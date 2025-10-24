import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import AlunoDetails from '@/components/coach/AlunoDetails';

export default async function AlunoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar dados do coach
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (coachProfile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  // Buscar dados do aluno
  const { data: alunoProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!alunoProfile || alunoProfile.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  // Buscar fotos de progresso
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('aluno_id', params.id)
    .order('week_number', { ascending: false });

  // Buscar mensagens
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .eq('aluno_id', params.id)
    .order('created_at', { ascending: true });

  // Buscar todas as dietas
  const { data: dietas } = await supabase
    .from('dietas')
    .select('*')
    .eq('aluno_id', params.id)
    .order('created_at', { ascending: false });

  // Buscar todos os treinos
  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', params.id)
    .order('created_at', { ascending: false });

  // Marcar mensagens como lidas
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('aluno_id', params.id)
    .neq('sender_id', session.user.id);

  return (
    <AppLayout profile={coachProfile}>
      <AlunoDetails
        aluno={alunoProfile}
        photos={photos || []}
        messages={messages || []}
        dietas={dietas || []}
        treinos={treinos || []}
        coachId={session.user.id}
      />
    </AppLayout>
  );
}
