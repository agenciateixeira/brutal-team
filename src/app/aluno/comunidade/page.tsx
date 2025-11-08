import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import CommunityClient from '@/components/community/CommunityClient';
import EmptyCommunityState from '@/components/community/EmptyCommunityState';

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

  const { data: userCommunities } = await supabase
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
  const isEmpty = communities.length === 0;

  if (isEmpty) {
    return (
      <AppLayout profile={profile}>
        <EmptyCommunityState />
      </AppLayout>
    );
  }

  const currentCommunityId = searchParams.community || PUBLIC_COMMUNITY_ID;
  const currentCommunity = communities.find((c: any) => c.id === currentCommunityId) || communities[0];

  const { data: communityMembers } = await supabase
    .from('community_members')
    .select('aluno_id')
    .eq('community_id', currentCommunity.id);

  const memberIds = communityMembers?.map((m) => m.aluno_id) || [];

  const { data: membersStats } = await supabase
    .from('community_stats')
    .select('*')
    .in('aluno_id', memberIds)
    .order('yearly_check_ins', { ascending: false });

  const { data: membersProfiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', memberIds);

  const avatarMap = new Map(membersProfiles?.map((p) => [p.id, p.avatar_url]) || []);

  const { data: communityPosts } = await supabase
    .from('community_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('community_id', currentCommunity.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const topMembers =
    membersStats?.slice(0, 3).map((member) => ({
      id: member.aluno_id,
      full_name: member.full_name,
      avatar_url: avatarMap.get(member.aluno_id) || null,
      yearly_check_ins: member.yearly_check_ins,
      current_streak: member.current_streak,
    })) || [];

  const rankingMembers =
    membersStats?.map((member) => ({
      id: member.aluno_id,
      full_name: member.full_name,
      avatar_url: avatarMap.get(member.aluno_id) || null,
      yearly_check_ins: member.yearly_check_ins,
      current_streak: member.current_streak,
      total_posts: member.total_posts,
    })) || [];

  const { data: allStudents } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'aluno')
    .neq('id', session.user.id)
    .order('full_name');

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
        allStudents={allStudents || []}
      />
    </AppLayout>
  );
}
