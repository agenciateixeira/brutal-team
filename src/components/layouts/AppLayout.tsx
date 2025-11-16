'use client';

import { Profile } from '@/types';
import Sidebar from '@/components/ui/Sidebar';
import BottomNavigation from '@/components/ui/BottomNavigation';
import PullToRefresh from '@/components/ui/PullToRefresh';
import RequireSubscription from '@/components/auth/RequireSubscription';

interface AppLayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

export default function AppLayout({ children, profile }: AppLayoutProps) {
  // Se for coach, envolve com RequireSubscription
  const content = profile.role === 'coach' ? (
    <RequireSubscription profile={profile}>
      {children}
    </RequireSubscription>
  ) : (
    children
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar profile={profile} />

      {/* Pull to Refresh */}
      <PullToRefresh />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0 pb-24 md:pb-8">
          {content}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation profile={profile} />
    </div>
  );
}
