'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { UserPlus, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface PendingApprovalsProps {
  pendingAlunos: Profile[];
  coachId: string;
}

export default function PendingApprovals({ pendingAlunos, coachId }: PendingApprovalsProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null);
  const [paymentDueDay, setPaymentDueDay] = useState('5');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [hiddenAlunos, setHiddenAlunos] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  // Filtrar alunos que foram aprovados ou rejeitados
  const visibleAlunos = pendingAlunos.filter(aluno => !hiddenAlunos.has(aluno.id));

  const handleApprove = async (alunoId: string) => {
    if (!monthlyFee || parseFloat(monthlyFee) <= 0) {
      setToast({ type: 'error', message: 'Por favor, informe o valor da mensalidade' });
      return;
    }

    const dueDay = parseInt(paymentDueDay);
    if (dueDay < 1 || dueDay > 28) {
      setToast({ type: 'error', message: 'Dia de vencimento deve ser entre 1 e 28' });
      return;
    }

    setProcessing(alunoId);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          approved: true,
          approved_by: coachId,
          approved_at: now,
          payment_due_day: dueDay,
          monthly_fee: parseFloat(monthlyFee),
          last_payment_date: now.split('T')[0], // Define pagamento de hoje
          payment_status: 'active',
        })
        .eq('id', alunoId);

      if (error) throw error;

      // Remover imediatamente da lista (otimista)
      setHiddenAlunos(prev => new Set(prev).add(alunoId));
      setToast({ type: 'success', message: 'Aluno aprovado com sucesso!' });
      setShowApprovalForm(null);
      setMonthlyFee('');
      setPaymentDueDay('5');

      // Hard refresh para garantir que a página recarregue do servidor
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao aprovar aluno:', error);
      setToast({ type: 'error', message: `Erro ao aprovar: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (alunoId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro? O usuário será excluído do sistema.')) return;

    setProcessing(alunoId);

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', alunoId);

      if (error) throw error;

      // Remover imediatamente da lista (otimista)
      setHiddenAlunos(prev => new Set(prev).add(alunoId));
      setToast({ type: 'success', message: 'Cadastro rejeitado' });

      // Hard refresh para garantir que a página recarregue do servidor
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao rejeitar aluno:', error);
      setToast({ type: 'error', message: `Erro ao rejeitar: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  if (visibleAlunos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={24} className="text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cadastros Pendentes ({visibleAlunos.length})
          </h2>
        </div>

        <div className="space-y-3">
          {visibleAlunos.map((aluno) => (
            <div
              key={aluno.id}
              className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {aluno.full_name || 'Sem nome'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{aluno.email}</p>
                  {aluno.phone_number && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{aluno.phone_number}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Cadastrado em {format(new Date(aluno.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                {showApprovalForm !== aluno.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApprovalForm(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>

              {/* Formulário de Aprovação */}
              {showApprovalForm === aluno.id && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4 mt-3 border-2 border-green-500">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Configurar Pagamento
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Calendar size={16} className="inline mr-1" />
                        Dia de Vencimento
                      </label>
                      <select
                        value={paymentDueDay}
                        onChange={(e) => setPaymentDueDay(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>
                            Dia {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <DollarSign size={16} className="inline mr-1" />
                        Valor da Mensalidade (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        placeholder="Ex: 150.00"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ℹ️ O primeiro pagamento será registrado como feito hoje, com status ativo.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >
                      {processing === aluno.id ? 'Aprovando...' : 'Confirmar Aprovação'}
                    </button>
                    <button
                      onClick={() => {
                        setShowApprovalForm(null);
                        setMonthlyFee('');
                        setPaymentDueDay('5');
                      }}
                      disabled={processing === aluno.id}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
