'use client';

import { useState } from 'react';
import { Profile } from '@/types';
import { UserPlus, CheckCircle, XCircle, Calendar, DollarSign, Copy, Key, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface PendingApprovalsProps {
  pendingAlunos: Profile[];
  coachId: string;
}

type PlanType = 'mensal' | 'semestral' | 'anual';

interface AccessCodeData {
  code: string;
  isActive: boolean;
}

export default function PendingApprovals({ pendingAlunos, coachId }: PendingApprovalsProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null);
  const [paymentDueDay, setPaymentDueDay] = useState('5');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [planType, setPlanType] = useState<PlanType>('mensal');
  const [accessCodes, setAccessCodes] = useState<Record<string, AccessCodeData>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [hiddenAlunos, setHiddenAlunos] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Filtrar alunos que foram aprovados ou rejeitados
  const visibleAlunos = pendingAlunos.filter(aluno => !hiddenAlunos.has(aluno.id));

  const handleApprove = async (alunoId: string) => {
    if (!monthlyFee || parseFloat(monthlyFee) <= 0) {
      setToast({ type: 'error', message: 'Por favor, informe o valor da mensalidade' });
      return;
    }

    if (!totalValue || parseFloat(totalValue) <= 0) {
      setToast({ type: 'error', message: 'Por favor, informe o valor total' });
      return;
    }

    const dueDay = parseInt(paymentDueDay);
    if (dueDay < 1 || dueDay > 28) {
      setToast({ type: 'error', message: 'Dia de vencimento deve ser entre 1 e 28' });
      return;
    }

    setProcessing(alunoId);

    try {
      // Chamar API route server-side para aprovar
      const response = await fetch('/api/approve-aluno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alunoId,
          paymentDueDay: dueDay,
          monthlyFee: parseFloat(monthlyFee),
          totalValue: parseFloat(totalValue),
          planType,
          coachId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aprovar aluno');
      }

      console.log('Aluno aprovado:', result);

      // Armazenar código de acesso
      if (result.accessCode) {
        setAccessCodes(prev => ({
          ...prev,
          [alunoId]: {
            code: result.accessCode,
            isActive: false
          }
        }));
      }

      setToast({ type: 'success', message: 'Aluno aprovado! Confirme o pagamento para ativar o código.' });
    } catch (error: any) {
      console.error('Erro ao aprovar aluno:', error);
      setToast({ type: 'error', message: `Erro ao aprovar: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmPayment = async (alunoId: string) => {
    setProcessing(alunoId);

    try {
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alunoId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao confirmar pagamento');
      }

      // Atualizar estado do código
      setAccessCodes(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          isActive: true
        }
      }));

      setToast({ type: 'success', message: 'Pagamento confirmado! Código ativado.' });

      // Após 3 segundos, remover da lista
      setTimeout(() => {
        setHiddenAlunos(prev => new Set(prev).add(alunoId));
        setShowApprovalForm(null);
        setMonthlyFee('');
        setTotalValue('');
        setPaymentDueDay('5');
        setPlanType('mensal');
        router.refresh();
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      setToast({ type: 'error', message: `Erro ao confirmar: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ type: 'success', message: 'Código copiado!' });
  };

  const handleReject = async (alunoId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro? O usuário será excluído do sistema.')) return;

    setProcessing(alunoId);

    try {
      // Chamar API route server-side para rejeitar
      const response = await fetch('/api/reject-aluno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alunoId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao rejeitar aluno');
      }

      console.log('Aluno rejeitado:', result);

      // Remover imediatamente da lista (otimista)
      setHiddenAlunos(prev => new Set(prev).add(alunoId));
      setToast({ type: 'success', message: 'Cadastro rejeitado' });

      // Refresh da página após um delay
      setTimeout(() => {
        router.refresh();
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
              <div className="mb-3">
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
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <button
                      onClick={() => setShowApprovalForm(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>

              {/* Formulário de Aprovação */}
              {showApprovalForm === aluno.id && !accessCodes[aluno.id] && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4 mt-3 border-2 border-green-500">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Configurar Plano e Pagamento
                  </h4>

                  {/* Tipo de Plano */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Tipo de Plano
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPlanType('mensal')}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          planType === 'mensal'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanType('semestral')}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          planType === 'semestral'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Semestral
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanType('anual')}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          planType === 'anual'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Anual
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <DollarSign size={16} className="inline mr-1" />
                        Valor Mensal (R$)
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <DollarSign size={16} className="inline mr-1" />
                        Valor Total (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={totalValue}
                        onChange={(e) => setTotalValue(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        placeholder="Ex: 900.00"
                        required
                      />
                    </div>

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
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ℹ️ Após aprovar, você receberá um código de acesso para enviar ao aluno via WhatsApp.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(aluno.id)}
                      disabled={processing === aluno.id}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
                    >
                      {processing === aluno.id ? 'Aprovando...' : 'Aprovar e Gerar Código'}
                    </button>
                    <button
                      onClick={() => {
                        setShowApprovalForm(null);
                        setMonthlyFee('');
                        setTotalValue('');
                        setPaymentDueDay('5');
                        setPlanType('mensal');
                      }}
                      disabled={processing === aluno.id}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Código de Acesso Gerado */}
              {accessCodes[aluno.id] && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4 mt-3 border-2 border-blue-500">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Key size={20} className="text-blue-600" />
                    Código de Acesso Gerado
                  </h4>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Código:
                      </span>
                      <button
                        onClick={() => copyToClipboard(accessCodes[aluno.id].code)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        <Copy size={14} />
                        Copiar
                      </button>
                    </div>
                    <p className="text-2xl font-mono font-bold text-blue-900 dark:text-blue-100 tracking-widest text-center">
                      {accessCodes[aluno.id].code}
                    </p>
                  </div>

                  {!accessCodes[aluno.id].isActive ? (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ⚠️ <strong>Importante:</strong> O código foi gerado mas ainda não está ativo.
                        Confirme o pagamento do aluno para ativar o código.
                      </p>

                      <button
                        onClick={() => handleConfirmPayment(aluno.id)}
                        disabled={processing === aluno.id}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} />
                        {processing === aluno.id ? 'Confirmando...' : 'Confirmar Pagamento e Ativar Código'}
                      </button>
                    </>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle size={16} />
                        <strong>Código ativado!</strong> Envie para o aluno via WhatsApp.
                      </p>
                    </div>
                  )}
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
