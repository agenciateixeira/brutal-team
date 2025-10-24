'use client';

import { Profile } from '@/types';
import Sidebar from '@/components/ui/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  profile: Profile;
}

export default function AppLayout({ children, profile }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar profile={profile} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
