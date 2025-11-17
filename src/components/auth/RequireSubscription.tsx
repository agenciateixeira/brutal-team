'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Componente que bloqueia acesso às páginas do coach
 * se ele não tiver uma assinatura ativa.
 *
 * Permite acesso apenas a:
 * - /coach/assinatura (para escolher plano)
 * - /coach/pagamento-sucesso (após pagamento)
 */
interface RequireSubscriptionProps {
  children: React.ReactNode
}

export default function RequireSubscription({ children }: RequireSubscriptionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, loading, session } = useAuth()

  if (loading || (!profile && session)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando assinatura...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Sessão expirada, redirecionando...</p>
        </div>
      </div>
    )
  }

  const hasActiveSubscription =
    profile?.stripe_subscription_status === 'active' ||
    profile?.stripe_subscription_status === 'trialing'

  const allowedPaths = [
    '/coach/assinatura',
    '/coach/pagamento-sucesso',
  ]

  const isAllowedPath = allowedPaths.some(path => pathname?.startsWith(path))

  useEffect(() => {
    // Se não tem assinatura ativa e não está em uma página permitida
    if (!hasActiveSubscription && !isAllowedPath) {
      console.log('[RequireSubscription] Redirecionando para /coach/assinatura')
      router.push('/coach/assinatura')
    }
  }, [hasActiveSubscription, isAllowedPath, pathname])

  // Se não tem assinatura e não está em página permitida, não renderiza
  if (!hasActiveSubscription && !isAllowedPath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecionando para escolher plano...
          </p>
        </div>
      </div>
    )
  }

  // Se tem assinatura OU está em página permitida, renderiza normalmente
  return <>{children}</>
}
