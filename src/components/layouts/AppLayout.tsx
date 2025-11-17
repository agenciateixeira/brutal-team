'use client';

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/ui/Sidebar'
import BottomNavigation from '@/components/ui/BottomNavigation'
import PullToRefresh from '@/components/ui/PullToRefresh'
import RequireSubscription from '@/components/auth/RequireSubscription'
import RequirePayment from '@/components/auth/RequirePayment'
import { Profile } from '@/types'

interface AppLayoutProps {
  children: ReactNode
  profile?: any
}

export default function AppLayout({ children, profile: profileProp }: AppLayoutProps) {
  const { profile: contextProfile, loading, session } = useAuth()
  const profile = (profileProp as Profile) || contextProfile

  if (loading || (!profile && session)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Sessão expirada. Faça login novamente.</div>
      </div>
    )
  }

  let content = children

  if (profile.role === 'coach') {
    content = <RequireSubscription profile={profile}>{children}</RequireSubscription>
  } else if (profile.role === 'aluno') {
    content = <RequirePayment profile={profile}>{children}</RequirePayment>
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar profile={profile} />
      <PullToRefresh />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0 pb-24 md:pb-8">
          {content}
        </div>
      </main>
      <BottomNavigation profile={profile} />
    </div>
  )
}
