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

  // Buscar dados do aluno APENAS se pertencer a este coach
  const { data: alunoProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', session.user.id) // ✅ FILTRO CRÍTICO: apenas alunos deste coach
    .single();

  // Se não encontrou ou não é aluno, redirecionar
  if (!alunoProfile || alunoProfile.role !== 'aluno') {
    console.error('[Security] Coach tentou acessar aluno de outro coach:', {
      coachId: session.user.id,
      attemptedAlunoId: params.id
    });
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

  // Buscar todos os protocolos hormonais
  const { data: protocolos } = await supabase
    .from('protocolos_hormonais')
    .select('*')
    .eq('aluno_id', params.id)
    .order('created_at', { ascending: false });

  // Buscar código de primeiro acesso
  const { data: accessCode } = await supabase
    .from('access_codes')
    .select('*')
    .eq('aluno_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Primeiro, vamos verificar se existem anamneses para este email SEM filtro de completed
  const { data: allAnamneseForEmail, count: totalCount } = await supabase
    .from('anamnese_responses')
    .select('*', { count: 'exact' })
    .eq('temp_email', alunoProfile.email);

  console.log('=== DEBUG ANAMNESE DO ALUNO ===');
  console.log('📧 Email do aluno:', alunoProfile.email);
  console.log('📊 Total de anamneses (todas):', totalCount);
  console.log('📋 Dados de todas anamneses:', allAnamneseForEmail);

  // Buscar respostas do questionário de anamnese (apenas completas, mais recente)
  const { data: anamneseResponse, error: anamneseError } = await supabase
    .from('anamnese_responses')
    .select('*')
    .eq('temp_email', alunoProfile.email)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('✅ Anamnese completa encontrada:', anamneseResponse ? 'SIM' : 'NÃO');
  console.log('📝 Dados da anamnese completa:', anamneseResponse);
  if (anamneseError) {
    console.error('❌ Erro ao buscar anamnese:', anamneseError);
    console.error('❌ Detalhes do erro:', JSON.stringify(anamneseError, null, 2));
  }
  console.log('=== FIM DEBUG ===');

  // Buscar fotos de primeiro acesso
  const { data: firstAccessPhotos } = await supabase
    .from('first_access_photos')
    .select('*')
    .eq('aluno_id', params.id)
    .maybeSingle();

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
        protocolos={protocolos || []}
        coachId={session.user.id}
        accessCode={accessCode}
        anamneseResponse={anamneseResponse}
        firstAccessPhotos={firstAccessPhotos}
      />
    </AppLayout>
  );
}
