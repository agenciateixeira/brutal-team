import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PerfilForm from '@/components/perfil/PerfilForm';
import PushNotificationSettings from '@/components/settings/PushNotificationSettings';

export default async function AlunoPerfilPage() {
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

  // Buscar informações de quem indicou este aluno
  let referrerInfo = null;
  if (profile?.referred_by) {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, full_name, email, referral_code')
      .eq('referral_code', profile.referred_by)
      .maybeSingle();

    if (referrer) {
      referrerInfo = {
        name: referrer.full_name || referrer.email,
        email: referrer.email,
        code: referrer.referral_code,
      };
    }
  }

  // Buscar estatísticas de indicação do aluno
  const { data: stats } = await supabase
    .from('referral_stats')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  // Buscar lista de indicações feitas por este aluno
  const { data: myReferrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meu Perfil
        </h1>
        <PerfilForm profile={profile} referrerInfo={referrerInfo} stats={stats} myReferrals={myReferrals || []} />
        <PushNotificationSettings />
      </div>
    </AppLayout>
  );
}
