'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'

interface Student {
  id: string
  student: {
    id: string
    full_name: string
    email: string
  }
  status: string
  subscription?: {
    id: string
    status: string
    amount: number
    current_period_end: string
  }
  stats: {
    total_received: number
  }
}

export default function AlunosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [invitationStats, setInvitationStats] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    amount: '30000',
    interval: 'month',
    dueDay: '',
    trialDays: '0',
  })
  const [paymentLink, setPaymentLink] = useState('')
  const [whatsappLink, setWhatsappLink] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    loadProfile()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  useEffect(() => {
    if (profile) {
      loadStudents()
      loadInvitations()
    }
  }, [profile])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/coach/list-students')
      const data = await res.json()
      setStudents(data.students || [])
      setStats(data.stats || {})
    } catch (err) {
      console.error(err)
    }
  }

  const loadInvitations = async () => {
    try {
      const res = await fetch('/api/coach/list-payment-invitations?status=pending')
      const data = await res.json()
      setInvitations(data.invitations || [])
      setInvitationStats(data.stats || {})
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setPaymentLink('')
    setWhatsappLink('')

    try {
      const res = await fetch('/api/coach/create-payment-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          studentPhone: formData.studentPhone,
          amount: parseInt(formData.amount),
          interval: formData.interval,
          dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
          trialDays: parseInt(formData.trialDays),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar convite')
      }

      // Mostrar link de pagamento e WhatsApp
      setPaymentLink(data.invitation.link)
      setWhatsappLink(data.invitation.whatsappLink)

      // Não fechar o modal ainda - mostrar os links primeiro
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError('')
    setPaymentLink('')
    setWhatsappLink('')
    setFormData({
      studentName: '',
      studentEmail: '',
      studentPhone: '',
      amount: '30000',
      interval: 'month',
      dueDay: '',
      trialDays: '0',
    })
    loadStudents()
    loadInvitations()
  }

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return

    try {
      const res = await fetch('/api/coach/cancel-student-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, cancelImmediately: false }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await loadStudents()
      showNotification(data.message, 'success')
    } catch (err: any) {
      showNotification(err.message, 'error')
    }
  }

  const handleSyncStripeAccount = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/coach/sync-stripe-account', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sincronizar conta')
      }

      await loadProfile()
      showNotification(data.message, 'success')
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const formatMoney = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meus Alunos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus alunos e cobranças recorrentes
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Alunos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_students || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Alunos Ativos</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.active_students || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assinaturas Ativas</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.active_subscriptions || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Receita Mensal (MRR)</p>
              <p className="text-3xl font-bold text-[#0081A7]">
                {formatMoney(stats.monthly_recurring_revenue || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Convites Pendentes */}
        {invitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Convites Pendentes ({invitations.length})
              </h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Aluno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Enviado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Expira em
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {invitation.student_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {invitation.student_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#0081A7]">
                          {formatMoney(invitation.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(invitation.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(invitation.expires_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(invitation.link)
                                showNotification('Link copiado!', 'success')
                              }}
                              className="text-[#0081A7] hover:text-[#006685] text-sm font-medium"
                            >
                              📋 Copiar Link
                            </button>
                            {invitation.whatsappLink && (
                              <a
                                href={invitation.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                📱 WhatsApp
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {students.length} aluno{students.length !== 1 ? 's' : ''} com assinatura ativa
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSyncStripeAccount}
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar Stripe'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto bg-[#0081A7] text-white px-6 py-2 rounded-lg hover:bg-[#006685] transition-colors font-medium"
            >
              + Criar Cobrança
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {students.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Você ainda não tem alunos cadastrados
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="text-[#0081A7] hover:underline"
              >
                Criar primeira assinatura
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Total Recebido
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.student.full_name || 'Sem nome'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.subscription ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {student.subscription ? formatMoney(student.subscription.amount) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {student.subscription ? formatDate(student.subscription.current_period_end) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {formatMoney(student.stats.total_received)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {student.subscription && student.subscription.status === 'active' && (
                          <button
                            onClick={() => handleCancel(student.subscription!.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {paymentLink ? 'Link de Pagamento Gerado!' : 'Criar Cobrança Recorrente'}
            </h2>

            {paymentLink ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    ✅ Convite criado com sucesso! Envie o link abaixo para o aluno:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Link de Pagamento:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={paymentLink}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentLink)
                            showNotification('Link copiado para a área de transferência!', 'success')
                          }}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
                    >
                      📱 Enviar via WhatsApp
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full px-4 py-2 bg-[#0081A7] text-white rounded-lg hover:bg-[#006685] font-medium"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                    placeholder="João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email do Aluno *
                  </label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                    placeholder="aluno@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.studentPhone}
                    onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                    placeholder="(11) 98765-4321"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Para enviar o link direto no WhatsApp
                  </p>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor Mensal *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={(parseInt(formData.amount) || 0) / 100}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setFormData({
                        ...formData,
                        amount: Math.round(value * 100).toString(),
                      })
                    }}
                    step="0.01"
                    min="5"
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                    placeholder="300.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequência
                </label>
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                >
                  <option value="month">Mensal</option>
                  <option value="week">Semanal</option>
                  <option value="year">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dia do Vencimento (opcional)
                </label>
                <input
                  type="number"
                  value={formData.dueDay}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                  min="1"
                  max="28"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                  placeholder="Ex: 5, 10, 15..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Dia do mês para vencimento (1-28)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Período de Teste (dias)
                </label>
                <input
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                  min="0"
                  max="90"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0081A7]"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#0081A7] text-white px-4 py-2 rounded-lg hover:bg-[#006685] disabled:opacity-50 font-medium"
                >
                  {creating ? 'Gerando Link...' : 'Gerar Link de Pagamento'}
                </button>
              </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
          <div
            className={`rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 ${
              toastType === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <span className="text-2xl">
              {toastType === 'success' ? '✅' : '❌'}
            </span>
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
