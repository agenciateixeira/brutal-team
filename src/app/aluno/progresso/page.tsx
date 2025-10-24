import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PhotoUploadFull from '@/components/aluno/PhotoUploadFull';

export default async function ProgressoPage() {
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

  // Buscar fotos de progresso
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('week_number', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meu Progresso
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe sua evolução semanal através de fotos
          </p>
        </div>

        <PhotoUploadFull alunoId={session.user.id} photos={photos || []} />
      </div>
    </AppLayout>
  );
}
