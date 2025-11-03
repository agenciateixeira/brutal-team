import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ReferralDashboard from '@/components/aluno/ReferralDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IndicacaoPage() {
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

  // Buscar estatísticas de indicação
  const { data: stats } = await supabase
    .from('referral_stats')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  // Buscar lista de indicações
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎁 Programa de Indicação
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Indique amigos e ganhe descontos na mensalidade
          </p>
        </div>

        <ReferralDashboard
          profile={profile}
          stats={stats}
          referrals={referrals || []}
        />
      </div>
    </AppLayout>
  );
}
