import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import TreinoView from '@/components/aluno/TreinoView';

export default async function TreinoPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  // Buscar treino ativo
  const { data: treinoAtivo } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  // Buscar histórico de treinos
  const { data: historico } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meu Treino
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe sua rotina de exercícios
          </p>
        </div>

        <TreinoView
          alunoId={session.user.id}
          treinoAtivo={treinoAtivo}
          historico={historico || []}
        />
      </div>
    </AppLayout>
  );
}
