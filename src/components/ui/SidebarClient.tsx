'use client';

import Sidebar from './Sidebar';
import { Profile } from '@/types';

interface SidebarClientProps {
  profile: Profile;
}

export default function SidebarClient({ profile }: SidebarClientProps) {
  return <Sidebar profile={profile} />;
}
