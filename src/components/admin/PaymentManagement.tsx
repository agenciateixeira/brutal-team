'use client';

import { useState } from 'react';
import { Profile, PaymentStatus } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { DollarSign, Calendar, CreditCard, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentManagementProps {
  alunos: Profile[];
}

export default function PaymentManagement({ alunos }: PaymentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [selectedAluno, setSelectedAluno] = useState<Profile | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Filtrar alunos
  const filteredAlunos = alunos.filter(aluno => {
    const matchesSearch = aluno.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || aluno.payment_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: PaymentStatus | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'suspended':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getStatusLabel = (status: PaymentStatus | null) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      case 'suspended': return 'Suspenso';
      default: return 'Novo';
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const paymentDate = formData.get('payment_date') as string;
    const referenceMonth = formData.get('reference_month') as string;
    const paymentMethod = formData.get('payment_method') as string;
    const notes = formData.get('notes') as string;

    try {
      // Verificar se o aluno já tem dia de vencimento definido
      const { data: alunoData } = await supabase
        .from('profiles')
        .select('payment_due_day')
        .eq('id', selectedAluno?.id)
        .single();

      // Se não tiver dia de vencimento, definir baseado na data do pagamento
      if (!alunoData?.payment_due_day) {
        const paymentDay = new Date(paymentDate).getDate();
        await supabase
          .from('profiles')
          .update({ payment_due_day: paymentDay })
          .eq('id', selectedAluno?.id);
      }

      // Inserir pagamento no histórico (o trigger vai atualizar status e last_payment_date automaticamente)
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          aluno_id: selectedAluno?.id,
          amount,
          payment_date: paymentDate,
          reference_month: referenceMonth,
          status: 'paid',
          notes: notes || null,
        });

      if (paymentError) throw paymentError;

      setMessage({ type: 'success', text: 'Pagamento registrado com sucesso!' });
      setShowPaymentModal(false);
      setSelectedAluno(null);
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao registrar pagamento' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (alunoId: string, newStatus: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_status: newStatus })
        .eq('id', alunoId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Status atualizado com sucesso!' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar status' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Gerenciamento de Pagamentos
        </h2>

        {/* Mensagem de feedback */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtro de Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
              className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="pending">Pendentes</option>
              <option value="overdue">Atrasados</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Alunos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aluno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data de Cadastro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mensalidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAlunos.map((aluno) => (
              <tr key={aluno.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {aluno.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={aluno.avatar_url}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                          {aluno.full_name?.[0]?.toUpperCase() || aluno.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {aluno.full_name || 'Sem nome'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {aluno.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(aluno.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={aluno.payment_status || 'active'}
                    onChange={(e) => handleUpdateStatus(aluno.id, e.target.value as PaymentStatus)}
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(aluno.payment_status)} border-none cursor-pointer`}
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasado</option>
                    <option value="suspended">Suspenso</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    R$ {aluno.monthly_fee?.toFixed(2) || '0.00'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedAluno(aluno);
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    <DollarSign size={16} />
                    Registrar Pagamento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAlunos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum aluno encontrado
            </p>
          </div>
        )}
      </div>

      {/* Modal de Registro de Pagamento */}
      {showPaymentModal && selectedAluno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Registrar Pagamento
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Aluno: <strong>{selectedAluno.full_name || selectedAluno.email}</strong>
            </p>

            <form onSubmit={handleRegisterPayment} className="space-y-4">
              {/* Valor */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign size={18} />
                  Valor
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  defaultValue={selectedAluno.monthly_fee || ''}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              {/* Data do Pagamento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={18} />
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  name="payment_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Mês de Referência */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={18} />
                  Mês de Referência
                </label>
                <input
                  type="month"
                  name="reference_month"
                  required
                  defaultValue={new Date().toISOString().slice(0, 7)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Método de Pagamento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CreditCard size={18} />
                  Método de Pagamento
                </label>
                <select
                  name="payment_method"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione...</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Observações
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Observações adicionais (opcional)"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedAluno(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
