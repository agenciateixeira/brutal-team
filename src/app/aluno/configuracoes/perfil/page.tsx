import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PerfilPublicoForm from '@/components/aluno/settings/PerfilPublicoForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PerfilPublicoPage() {
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

  return (
    <AppLayout profile={profile}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        {/* Back Button */}
        <Link
          href="/aluno/configuracoes"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Voltar para Configurações</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Perfil Público
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Personalize como você aparece para outros usuários
          </p>
        </div>

        {/* Form */}
        <PerfilPublicoForm profile={profile} />
      </div>
    </AppLayout>
  );
}
