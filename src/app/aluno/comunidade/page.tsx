import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import YearCountdown from '@/components/community/YearCountdown';
import TopMembers from '@/components/community/TopMembers';
import FloatingPostButton from '@/components/community/FloatingPostButton';
import CommunityTabs from '@/components/community/CommunityTabs';
import { Users, Trophy, TrendingUp, Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ComunidadePage() {
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

  // Verificar se o usuário tem indicados (se não, mostrar mensagem)
  const { data: referrals } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', session.user.id)
    .eq('status', 'active');

  const hasReferrals = referrals && referrals.length > 0;

  // Se não tem indicados, mostrar página de convite
  if (!hasReferrals) {
    return (
      <AppLayout profile={profile}>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center space-y-6 p-8">
            {/* Ilustração */}
            <div className="relative">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                <Users className="text-white" size={64} />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-2xl">🔒</span>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                Comunidade Trancada
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Para desbloquear a comunidade, você precisa indicar pelo menos <strong>1 amigo</strong>!
              </p>
            </div>

            {/* Benefícios */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Flame className="text-orange-500" />
                O que você ganha na comunidade:
              </h2>
              <ul className="space-y-3 text-left max-w-md mx-auto">
                {[
                  { emoji: '📸', text: 'Postar treinos e ver posts dos amigos' },
                  { emoji: '🏆', text: 'Ranking competitivo em tempo real' },
                  { emoji: '🔥', text: 'Sistema de check-ins e sequências' },
                  { emoji: '💬', text: 'Comentar e curtir posts' },
                  { emoji: '🎯', text: 'Ver progresso de toda a rede' },
                  { emoji: '💪', text: 'Motivação em grupo' },
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <span className="text-2xl">{benefit.emoji}</span>
                    <span className="font-semibold">{benefit.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <a
                href="/aluno/indicacao"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <Users size={20} />
                Indicar Amigos e Desbloquear
              </a>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Compartilhe seu código com amigos e ganhe descontos + acesso à comunidade
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Buscar membros da rede (usando função SQL)
  const { data: networkMembers } = await supabase.rpc('get_community_network', {
    user_id: session.user.id,
  });

  const memberIds = networkMembers?.map((m: any) => m.member_id) || [];

  // Buscar stats dos membros
  const { data: membersStats } = await supabase
    .from('community_stats')
    .select('*')
    .in('aluno_id', memberIds)
    .order('yearly_check_ins', { ascending: false });

  // Buscar avatares dos membros
  const { data: membersProfiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', memberIds);

  // Criar mapa de avatares para lookup rápido
  const avatarMap = new Map(membersProfiles?.map(p => [p.id, p.avatar_url]) || []);

  // Buscar posts da rede
  const { data: communityPosts } = await supabase
    .from('community_posts')
    .select('*, profiles(full_name, avatar_url)')
    .in('aluno_id', memberIds)
    .order('created_at', { ascending: false })
    .limit(50);

  // Preparar dados para TopMembers (top 3)
  const topMembers = membersStats?.slice(0, 3).map(member => ({
    id: member.aluno_id,
    full_name: member.full_name,
    avatar_url: avatarMap.get(member.aluno_id) || null,
    yearly_check_ins: member.yearly_check_ins,
    current_streak: member.current_streak,
  })) || [];

  // Preparar dados para CommunityRanking
  const rankingMembers = membersStats?.map(member => ({
    id: member.aluno_id,
    full_name: member.full_name,
    avatar_url: avatarMap.get(member.aluno_id) || null,
    yearly_check_ins: member.yearly_check_ins,
    current_streak: member.current_streak,
    total_posts: member.total_posts,
  })) || [];

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-primary-600" />
              Comunidade
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sua rede tem <strong>{memberIds.length}</strong> {memberIds.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
        </div>

        {/* Countdown do Ano */}
        <YearCountdown />

        {/* Top Members */}
        {topMembers.length > 0 && <TopMembers members={topMembers} />}

        {/* Tabs: Feed / Ranking */}
        <CommunityTabs
          initialPosts={communityPosts || []}
          rankingMembers={rankingMembers}
          currentUserId={session.user.id}
        />

        {/* Floating Post Button */}
        <FloatingPostButton alunoId={session.user.id} />
      </div>
    </AppLayout>
  );
}
