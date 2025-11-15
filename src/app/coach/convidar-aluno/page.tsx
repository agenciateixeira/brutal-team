'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/layouts/AppLayout'

export default function ConvidarAluno() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [formData, setFormData] = useState({
    alunoEmail: '',
    alunoName: '',
    paymentDueDay: 5,
  })
  const [error, setError] = useState('')
  const [inviteHistory, setInviteHistory] = useState<any[]>([])

  useEffect(() => {
    loadProfile()
    loadInviteHistory()
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

      setProfile(profileData)
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    }
  }

  const loadInviteHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setInviteHistory(data || [])
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/coach/create-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar convite')
      }

      const { token } = await response.json()
      setInviteToken(token)
      setFormData({ alunoEmail: '', alunoName: '', paymentDueDay: 5 })
      loadInviteHistory()
    } catch (err: any) {
      console.error('Erro ao criar convite:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getInviteLink = () => {
    if (!inviteToken) return ''
    return `${window.location.origin}/cadastro?token=${inviteToken}`
  }

  const copyInviteLink = async () => {
    const link = getInviteLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const shareWhatsApp = () => {
    const link = getInviteLink()
    const message = `Olá! Você foi convidado para se tornar meu aluno na Brutal Team. Clique no link para se cadastrar: ${link}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  const copyExistingLink = async (token: string) => {
    const link = `${window.location.origin}/cadastro?token=${token}`
    try {
      await navigator.clipboard.writeText(link)
      alert('Link copiado!')
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja deletar este convite?')) return

    try {
      // ✅ SEGURANÇA: Garantir que apenas o dono do convite pode deletar
      const { error } = await supabase
        .from('invite_tokens')
        .delete()
        .eq('id', inviteId)
        .eq('coach_id', profile?.id) // ✅ FILTRO DE SEGURANÇA

      if (error) throw error

      alert('Convite deletado com sucesso!')
      loadInviteHistory()
    } catch (err) {
      console.error('Erro ao deletar convite:', err)
      alert('Erro ao deletar convite')
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Convidar Aluno
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gere um link de convite personalizado para seu aluno
          </p>
        </div>

        {/* Formulário de Convite */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Criar Novo Convite
          </h2>

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Aluno (opcional)
              </label>
              <input
                type="text"
                value={formData.alunoName}
                onChange={(e) =>
                  setFormData({ ...formData, alunoName: e.target.value })
                }
                placeholder="João Silva"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0081A7] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email do Aluno (opcional)
              </label>
              <input
                type="email"
                value={formData.alunoEmail}
                onChange={(e) =>
                  setFormData({ ...formData, alunoEmail: e.target.value })
                }
                placeholder="joao@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0081A7] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dia de Vencimento (1 a 28)
              </label>
              <select
                value={formData.paymentDueDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentDueDay: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0081A7] focus:border-transparent"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Dia {day}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Dia do mês em que o aluno deverá efetuar o pagamento
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0081A7] text-white py-3 rounded-lg font-medium hover:bg-[#006685] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando Convite...' : 'Gerar Link de Convite'}
            </button>
          </form>
        </div>

        {/* Link Gerado */}
        {inviteToken && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              ✅ Convite Criado com Sucesso!
            </h3>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Link do Convite:
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-mono break-all">
                {getInviteLink()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyInviteLink}
                className="flex-1 bg-[#0081A7] text-white py-2 rounded-lg font-medium hover:bg-[#006685] transition-colors"
              >
                {copiedLink ? '✓ Copiado!' : '📋 Copiar Link'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Histórico de Convites */}
        {inviteHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Histórico de Convites
            </h2>

            <div className="space-y-3">
              {inviteHistory.map((invite) => {
                const isActive = !invite.used && new Date(invite.expires_at) >= new Date()

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invite.aluno_name || 'Convite sem nome'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invite.aluno_email || 'Sem email'} · Vencimento dia{' '}
                        {invite.payment_due_day}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Criado em{' '}
                        {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <div>
                        {invite.used ? (
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            ✓ Usado
                          </span>
                        ) : new Date(invite.expires_at) < new Date() ? (
                          <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
                            Expirado
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        {/* Copiar Link (apenas se ativo) */}
                        {isActive && (
                          <button
                            onClick={() => copyExistingLink(invite.token)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Copiar link"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}

                        {/* Deletar (apenas se não usado) */}
                        {!invite.used && (
                          <button
                            onClick={() => deleteInvite(invite.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Deletar convite"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
