import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import YearCountdown from '@/components/community/YearCountdown';
import TopMembers from '@/components/community/TopMembers';
import CommunityClient from '@/components/community/CommunityClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PUBLIC_COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';

export default async function ComunidadePage({
  searchParams,
}: {
  searchParams: { community?: string };
}) {
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

  // Buscar todas as comunidades do usuário
  const { data: userCommunities, error: communitiesError } = await supabase
    .from('community_members')
    .select(`
      community_id,
      communities (
        id,
        name,
        description,
        type
      )
    `)
    .eq('aluno_id', session.user.id);

  const communities = userCommunities?.map((uc: any) => uc.communities).filter(Boolean) || [];

  // Se houver erro (tabela não existe) ou não tem comunidades, usar sistema antigo baseado em rede
  if (communitiesError || communities.length === 0) {
    // Verificar se o usuário tem indicados (sistema antigo)
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', session.user.id)
      .eq('status', 'active');

    const hasReferrals = referrals && referrals.length > 0;

    // Se não tem indicados E não tem comunidades, redirecionar
    if (!hasReferrals && communities.length === 0) {
      redirect('/aluno/indicacao');
    }

    // Se tem indicados mas não tem comunidades (migration não foi executada), usar view antiga
    if (hasReferrals && communities.length === 0) {
      // Sistema antigo - redirecionar para versão sem múltiplas comunidades
      // Por enquanto, mostrar mensagem
      return (
        <AppLayout profile={profile}>
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="max-w-2xl mx-auto text-center space-y-6 p-8 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Migração Pendente
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                O sistema de comunidades foi atualizado! Para acessar as novas funcionalidades, é necessário executar a migração do banco de dados.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Execute no Supabase:</p>
                <code className="text-sm text-gray-600 dark:text-gray-400">
                  sql/add_multiple_communities.sql
                </code>
              </div>
            </div>
          </AppLayout>
        );
    }
  }

  // Comunidade atual (da query string ou pública por padrão)
  const currentCommunityId = searchParams.community || PUBLIC_COMMUNITY_ID;
  const currentCommunity = communities.find((c: any) => c.id === currentCommunityId) || communities[0];

  // Buscar membros da comunidade atual
  const { data: communityMembers } = await supabase
    .from('community_members')
    .select('aluno_id')
    .eq('community_id', currentCommunity.id);

  const memberIds = communityMembers?.map((m) => m.aluno_id) || [];

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
  const avatarMap = new Map(membersProfiles?.map((p) => [p.id, p.avatar_url]) || []);

  // Buscar posts da comunidade atual
  const { data: communityPosts } = await supabase
    .from('community_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('community_id', currentCommunity.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Preparar dados para TopMembers (top 3)
  const topMembers =
    membersStats?.slice(0, 3).map((member) => ({
      id: member.aluno_id,
      full_name: member.full_name,
      avatar_url: avatarMap.get(member.aluno_id) || null,
      yearly_check_ins: member.yearly_check_ins,
      current_streak: member.current_streak,
    })) || [];

  // Preparar dados para CommunityRanking
  const rankingMembers =
    membersStats?.map((member) => ({
      id: member.aluno_id,
      full_name: member.full_name,
      avatar_url: avatarMap.get(member.aluno_id) || null,
      yearly_check_ins: member.yearly_check_ins,
      current_streak: member.current_streak,
      total_posts: member.total_posts,
    })) || [];

  // Buscar amigos da rede (para adicionar em comunidades privadas)
  const { data: networkMembers } = await supabase.rpc('get_community_network', {
    user_id: session.user.id,
  });

  const friendIds = networkMembers?.map((m: any) => m.member_id).filter((id: string) => id !== session.user.id) || [];

  const { data: friends } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', friendIds)
    .order('full_name');

  // Contar membros de cada comunidade
  const communitiesWithCounts = await Promise.all(
    communities.map(async (community: any) => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      return {
        ...community,
        member_count: count || 0,
      };
    })
  );

  return (
    <AppLayout profile={profile}>
      <CommunityClient
        communities={communitiesWithCounts}
        currentCommunity={{
          ...currentCommunity,
          member_count: memberIds.length,
        }}
        topMembers={topMembers}
        initialPosts={communityPosts || []}
        rankingMembers={rankingMembers}
        currentUserId={session.user.id}
        friends={friends || []}
      />
    </AppLayout>
  );
}
