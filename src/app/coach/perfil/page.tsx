import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PerfilForm from '@/components/perfil/PerfilForm';

export default async function CoachPerfilPage() {
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

  if (profile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Meu Perfil
        </h1>
        <PerfilForm profile={profile} />
      </div>
    </AppLayout>
  );
}
