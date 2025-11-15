'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import YearCountdown from './YearCountdown';
import TopMembers from './TopMembers';
import CommunityTabs from './CommunityTabs';
import FloatingPostButton from './FloatingPostButton';
import CommunitySwitcher from './CommunitySwitcher';
import CreateCommunityModal from './CreateCommunityModal';

interface Community {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  member_count: number;
}

interface TopMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  yearly_check_ins: number;
  current_streak: number;
}

interface RankingMember extends TopMember {
  total_posts: number;
}

interface Student {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface CommunityClientProps {
  communities: Community[];
  currentCommunity: Community;
  topMembers: TopMember[];
  initialPosts: any[];
  rankingMembers: RankingMember[];
  currentUserId: string;
  allStudents: Student[];
}

export default function CommunityClient({
  communities,
  currentCommunity,
  topMembers,
  initialPosts,
  rankingMembers,
  currentUserId,
  allStudents,
}: CommunityClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleCommunitySwitch = (communityId: string) => {
    router.push(`/aluno/comunidade?community=${communityId}`);
  };

  const handleCreateSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-primary-600" />
            Comunidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentCommunity.type === 'public'
              ? 'Comunidade pública de todos os alunos'
              : `Grupo privado com ${currentCommunity.member_count} ${currentCommunity.member_count === 1 ? 'membro' : 'membros'}`}
          </p>
        </div>

        {/* Community Switcher */}
        <CommunitySwitcher
          communities={communities}
          currentCommunityId={currentCommunity.id}
          onSwitch={handleCommunitySwitch}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />
      </div>

      {/* Countdown do Ano */}
      <YearCountdown />

      {/* Top Members */}
      {topMembers.length > 0 && <TopMembers members={topMembers} />}

      {/* Tabs: Feed / Ranking */}
      <CommunityTabs
        initialPosts={initialPosts}
        rankingMembers={rankingMembers}
        currentUserId={currentUserId}
        communityId={currentCommunity.id}
      />

      {/* Floating Post Button */}
      <FloatingPostButton
        alunoId={currentUserId}
        communityId={currentCommunity.id}
        allStudents={allStudents}
      />

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        alunoId={currentUserId}
        friends={allStudents}
      />
    </div>
  );
}
