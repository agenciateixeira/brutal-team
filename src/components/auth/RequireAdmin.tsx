'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'

interface RequireAdminProps {
  profile: Profile
  children: React.ReactNode
}

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br'

/**
 * Componente que bloqueia acesso às páginas administrativas
 * Apenas o email guilherme@agenciagtx.com.br tem acesso
 */
export default function RequireAdmin({ profile, children }: RequireAdminProps) {
  const router = useRouter()

  const isAdmin = profile.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) {
      console.log('[RequireAdmin] Acesso negado - redirecionando')
      // Redireciona para dashboard apropriado baseado na role
      if (profile.role === 'coach') {
        router.push('/coach/dashboard')
      } else {
        router.push('/aluno/dashboard')
      }
    }
  }, [isAdmin, profile.role, router])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Acesso negado
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
