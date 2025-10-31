import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import TemplatesManager from '@/components/coach/TemplatesManager';

// Forçar revalidação em cada request (sem cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoachTemplatesPage() {
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

  // Buscar templates de dieta
  const { data: dietTemplates } = await supabase
    .from('dieta_templates')
    .select('*')
    .eq('coach_id', session.user.id)
    .order('times_used', { ascending: false });

  // Buscar templates de treino
  const { data: workoutTemplates } = await supabase
    .from('treino_templates')
    .select('*')
    .eq('coach_id', session.user.id)
    .order('times_used', { ascending: false });

  // Buscar templates de protocolo
  const { data: protocolTemplates } = await supabase
    .from('protocolo_templates')
    .select('*')
    .eq('coach_id', session.user.id)
    .order('times_used', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Crie e gerencie templates reutilizáveis de dietas, treinos e protocolos
          </p>
        </div>

        <TemplatesManager
          dietTemplates={dietTemplates || []}
          workoutTemplates={workoutTemplates || []}
          protocolTemplates={protocolTemplates || []}
          coachId={session.user.id}
        />
      </div>
    </AppLayout>
  );
}
