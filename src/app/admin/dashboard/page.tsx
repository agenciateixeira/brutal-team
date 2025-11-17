import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

export default async function AdminDashboardPage() {
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

  if (profile?.email !== ADMIN_EMAIL) {
    redirect(profile?.role === 'coach' ? '/coach/dashboard' : '/aluno/dashboard');
  }

  return (
    <AdminLayout profile={profile}>
      <div className="min-h-screen bg-[#F5FBFF] dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AdminDashboardClient />
        </div>
      </div>
    </AdminLayout>
  );
}
