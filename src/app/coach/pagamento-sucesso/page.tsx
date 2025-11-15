'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PagamentoSucesso() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const fromCadastro = searchParams.get('from') === 'cadastro'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setError('Sessão não encontrada')
      setLoading(false)
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento')
      }

      const data = await response.json()

      if (data.success) {
        // Se veio do cadastro, redirecionar para login
        // Caso contrário, redirecionar para o dashboard
        setTimeout(() => {
          if (fromCadastro) {
            router.push('/login')
          } else {
            router.push('/coach/dashboard')
          }
        }, 3000)
      } else {
        setError('Pagamento não confirmado')
      }
    } catch (err: any) {
      console.error('Erro ao verificar pagamento:', err)
      setError(err.message || 'Erro ao verificar pagamento')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verificando pagamento...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erro no Pagamento
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>

            <button
              onClick={() => router.push('/coach/escolher-plano')}
              className="w-full bg-[#0081A7] text-white py-3 px-4 rounded-lg hover:bg-[#006685] transition-colors font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {fromCadastro ? 'Cadastro Completo!' : 'Pagamento Confirmado!'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {fromCadastro
              ? 'Sua conta foi criada e sua assinatura foi ativada com sucesso!'
              : 'Sua assinatura foi ativada com sucesso.'}
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            {fromCadastro
              ? 'Redirecionando para o login...'
              : 'Redirecionando para o dashboard...'}
          </p>

          <div className="animate-pulse">
            <div className="h-2 bg-[#0081A7] rounded-full w-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
