'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface RequirePaymentProps {
  profile: Profile
  children: React.ReactNode
}

/**
 * Componente que bloqueia acesso às páginas do aluno
 * se ele estiver inadimplente por mais de 24h.
 *
 * Status de inadimplência: 'past_due' ou 'unpaid'
 * Permite acesso apenas a:
 * - /aluno/pagamento (para regularizar)
 */
export default function RequirePayment({ profile, children }: RequirePaymentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)

  const allowedPaths = [
    '/aluno/pagamento',
  ]

  const isAllowedPath = allowedPaths.some(path => pathname?.startsWith(path))

  useEffect(() => {
    checkPaymentStatus()
  }, [profile.id])

  const checkPaymentStatus = async () => {
    try {
      // Buscar subscription ativa do aluno
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('aluno_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!subscription) {
        // Sem subscription = sem acesso
        setIsBlocked(true)
        setLoading(false)
        return
      }

      // Verificar se está inadimplente
      const isOverdue = subscription.status === 'past_due' || subscription.status === 'unpaid'

      if (isOverdue) {
        // Verificar se passou 24h desde a última atualização
        const updatedAt = new Date(subscription.updated_at)
        const now = new Date()
        const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceUpdate >= 24) {
          console.log('[RequirePayment] Aluno bloqueado - inadimplente há mais de 24h')
          setIsBlocked(true)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('[RequirePayment] Erro ao verificar status:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Se bloqueado e não está em página permitida, redireciona
    if (!loading && isBlocked && !isAllowedPath) {
      console.log('[RequirePayment] Redirecionando para /aluno/pagamento')
      router.push('/aluno/pagamento')
    }
  }, [isBlocked, isAllowedPath, pathname, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verificando status de pagamento...
          </p>
        </div>
      </div>
    )
  }

  // Se bloqueado e não está em página permitida, mostra loading (enquanto redireciona)
  if (isBlocked && !isAllowedPath) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecionando para pagamento...
          </p>
        </div>
      </div>
    )
  }

  // Se não bloqueado OU está em página permitida, renderiza normalmente
  return <>{children}</>
}
