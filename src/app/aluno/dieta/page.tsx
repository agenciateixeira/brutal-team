import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import DietaView from '@/components/aluno/DietaView';

export default async function DietaPage() {
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

  // Buscar dieta ativa
  const { data: dietaAtiva } = await supabase
    .from('dietas')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  // Buscar histórico de dietas
  const { data: historico } = await supabase
    .from('dietas')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minha Dieta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe seu plano alimentar
          </p>
        </div>

        <DietaView
          alunoId={session.user.id}
          dietaAtiva={dietaAtiva}
          historico={historico || []}
        />
      </div>
    </AppLayout>
  );
}
