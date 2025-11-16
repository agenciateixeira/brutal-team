'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface InvitationData {
  id: string
  studentName: string
  studentEmail: string
  amount: number
  interval: string
  dueDay?: number
  trialDays: number
  description: string
  expiresAt: string
  coach: {
    id: string
    name: string
    email: string
  }
}

export default function PaymentInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
  })

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(`/api/payment-invitation/${token}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Convite não encontrado')
      }

      setInvitation(data.invitation)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError('')

    try {
      // Validações
      if (formData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem')
      }

      if (!formData.acceptTerms) {
        throw new Error('Você precisa aceitar os termos de uso')
      }

      // 1. Verificar se email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invitation!.studentEmail)
        .maybeSingle() // Use maybeSingle() para evitar erro se não encontrar

      if (checkError) {
        console.error('Erro ao verificar email:', checkError)
        // Continua tentando criar conta mesmo se houver erro na verificação
      }

      if (existingUser) {
        // Email já cadastrado - fazer login e ir para checkout
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation!.studentEmail,
          password: formData.password,
        })

        if (signInError) {
          throw new Error('Email já cadastrado. Verifique sua senha.')
        }
      } else {
        // Criar nova conta
        const { error: signUpError } = await supabase.auth.signUp({
          email: invitation!.studentEmail,
          password: formData.password,
          options: {
            data: {
              full_name: invitation!.studentName,
              role: 'student',
            },
          },
        })

        if (signUpError) {
          // Se erro for "user already registered", tentar fazer login
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: invitation!.studentEmail,
              password: formData.password,
            })

            if (signInError) {
              throw new Error('Email já cadastrado. Verifique sua senha.')
            }
          } else {
            throw new Error(signUpError.message)
          }
        }
      }

      // 2. Criar checkout session
      const checkoutRes = await fetch('/api/student/subscribe-to-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: invitation!.coach.id,
          amount: invitation!.amount,
          interval: invitation!.interval,
          invitationToken: token,
        }),
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Erro ao criar checkout')
      }

      // 3. Redirecionar para Stripe Checkout
      if (checkoutData.sessionUrl) {
        window.location.href = checkoutData.sessionUrl
      }
    } catch (err: any) {
      setError(err.message)
      setProcessing(false)
    }
  }

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const getIntervalText = (interval: string) => {
    const map: Record<string, string> = {
      month: 'Mensal',
      week: 'Semanal',
      year: 'Anual',
    }
    return map[interval] || interval
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0081A7] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Convite Inválido
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[#0081A7] text-white rounded-lg hover:bg-[#006685]"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Brutal Team"
              width={200}
              height={60}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Complete seu cadastro para começar
          </p>
        </div>

        {/* Card do Convite */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Você foi convidado por:
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {invitation?.coach.name}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Seu nome:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invitation?.studentName}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invitation?.studentEmail}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Valor:</span>
              <span className="text-2xl font-bold text-[#0081A7]">
                {formatMoney(invitation?.amount || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Cobrança:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {getIntervalText(invitation?.interval || '')}
              </span>
            </div>

            {invitation?.trialDays && invitation.trialDays > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  🎉 Você tem {invitation.trialDays} dias de teste grátis!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Complete seu cadastro
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                placeholder="Digite a senha novamente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone (opcional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                placeholder="(11) 98765-4321"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                required
                className="mt-1 mr-2"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Eu aceito os{' '}
                <a href="/termos" target="_blank" className="text-[#0081A7] hover:underline">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" className="text-[#0081A7] hover:underline">
                  política de privacidade
                </a>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#0081A7] text-white px-6 py-3 rounded-lg hover:bg-[#006685] disabled:opacity-50 font-medium text-lg"
            >
              {processing ? 'Processando...' : 'Continuar para Pagamento'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Você será redirecionado para o checkout seguro do Stripe
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
