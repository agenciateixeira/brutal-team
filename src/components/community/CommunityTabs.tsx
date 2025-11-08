'use client';

import { useState } from 'react';
import { TrendingUp, Trophy } from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import CommunityRanking from './CommunityRanking';

interface CommunityTabsProps {
  initialPosts: any[];
  rankingMembers: any[];
  currentUserId: string;
  communityId: string;
}

export default function CommunityTabs({ initialPosts, rankingMembers, currentUserId, communityId }: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'ranking'>('feed');

  return (
    <div className="relative overflow-hidden backdrop-blur-2xl bg-white/40 dark:bg-gray-800/40 rounded-2xl shadow-2xl border-2 border-white/60 dark:border-gray-700/60">
      {/* Liquid Glass Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-blue-500/10 to-purple-500/10"></div>
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

      <div className="relative z-10">
        {/* Tabs Header */}
        <div className="border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <TrendingUp size={18} />
                Feed
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'ranking'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Trophy size={18} />
                Ranking
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'feed' ? (
            <CommunityFeed
              initialPosts={initialPosts}
              currentUserId={currentUserId}
            />
          ) : (
            <CommunityRanking
              members={rankingMembers}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
