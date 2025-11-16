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
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    studentEmail: '',
    amount: '30000',
    interval: 'month',
    trialDays: '0',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      loadStudents()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/coach/create-student-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: formData.studentEmail,
          amount: parseInt(formData.amount),
          interval: formData.interval,
          trialDays: parseInt(formData.trialDays),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      setShowModal(false)
      setFormData({
        studentEmail: '',
        amount: '30000',
        interval: 'month',
        trialDays: '0',
      })
      await loadStudents()
      alert('Assinatura criada com sucesso!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
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
      alert(data.message)
    } catch (err: any) {
      alert(err.message)
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

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {students.length} aluno{students.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#0081A7] text-white px-6 py-2 rounded-lg hover:bg-[#006685] transition-colors font-medium"
          >
            + Nova Assinatura
          </button>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Nova Assinatura
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  O aluno precisa estar cadastrado na plataforma
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
                  onClick={() => {
                    setShowModal(false)
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#0081A7] text-white px-4 py-2 rounded-lg hover:bg-[#006685] disabled:opacity-50 font-medium"
                >
                  {creating ? 'Criando...' : 'Criar Assinatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
