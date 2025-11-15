'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'
import KYCForm, { KYCSubmitData } from '@/components/forms/KYCForm'

export default function DadosBancarios() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [kycLoading, setKycLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('[Dados Bancários] Profile carregado:', {
        hasProfile: !!profileData,
        hasStripeAccountId: !!profileData?.stripe_account_id,
        chargesEnabled: profileData?.stripe_charges_enabled,
        payoutsEnabled: profileData?.stripe_payouts_enabled,
      })

      setProfile(profileData)

      // Se já tem KYC completo, mostrar sucesso
      if (profileData?.stripe_charges_enabled && profileData?.stripe_payouts_enabled) {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setError('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleKycSubmit = async (kycData: KYCSubmitData) => {
    setKycLoading(true)
    setError('')

    try {
      console.log('[Dados Bancários] Enviando dados KYC...')

      const response = await fetch('/api/stripe/submit-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao enviar dados de verificação')
      }

      console.log('[Dados Bancários] KYC enviado com sucesso:', data)

      // Mostrar sucesso e recarregar perfil
      setSuccess(true)
      await loadProfile()

      // Redirecionar para dashboard após 2 segundos
      setTimeout(() => {
        router.push('/coach/dashboard')
      }, 2000)

    } catch (err: any) {
      console.error('[Dados Bancários] Erro ao enviar KYC:', err)
      setError(err.message || 'Erro ao enviar dados de verificação')
    } finally {
      setKycLoading(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dados Bancários e Verificação
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {success
              ? 'Seus dados bancários estão configurados e verificados'
              : 'Configure seus dados bancários para receber pagamentos dos alunos'}
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✅ Verificação Concluída!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  Seus dados bancários foram verificados com sucesso pela Stripe. Você já pode receber pagamentos dos seus alunos!
                </p>
                <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-4 text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-2">Status da Conta:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span>Pagamentos habilitados: <strong>Sim</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span>Transferências habilitadas: <strong>Sim</strong></span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => router.push('/coach/dashboard')}
                    className="bg-[#0081A7] text-white px-6 py-2 rounded-lg hover:bg-[#006685] transition-colors font-medium"
                  >
                    Ir para Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/coach/pagamentos-stripe')}
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Ver Pagamentos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário KYC (apenas se não tiver verificação completa) */}
        {!success && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                📋 Informações Necessárias
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Para receber pagamentos, precisamos coletar alguns dados obrigatórios de verificação. Este processo é exigido pela Stripe e pelas regulamentações bancárias brasileiras.
              </p>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Dados Pessoais:</strong> CPF e data de nascimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Endereço:</strong> Endereço completo de residência</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span><strong>Dados Bancários:</strong> Conta onde você receberá os pagamentos</span>
                </li>
              </ul>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Formulário KYC */}
            <KYCForm
              onSubmit={handleKycSubmit}
              loading={kycLoading}
              userEmail={profile?.email}
              userPhone={profile?.phone}
              userName={profile?.full_name}
            />
          </div>
        )}

        {/* Informações sobre o processo */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🔒 Segurança dos Dados
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Todos os dados são criptografados e armazenados com segurança</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Processamento seguro pela Stripe (certificada PCI-DSS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Seus dados bancários não são compartilhados com terceiros</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Conformidade com LGPD e regulamentações bancárias</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
              💰 Taxas e Recebimentos
            </h3>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Taxa da plataforma: 2% por transação</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Taxa de processamento Stripe: ~3,99% + R$ 0,40</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Prazo de recebimento: Até 7 dias úteis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">•</span>
                <span>Transferências automáticas para sua conta</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
