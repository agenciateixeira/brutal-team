'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';

interface ManagePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent?: any;
  onSuccess: () => void;
}

export default function ManagePaymentModal({ isOpen, onClose, editingStudent, onSuccess }: ManagePaymentModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [alunos, setAlunos] = useState<any[]>([]);

  // Form state
  const [selectedAluno, setSelectedAluno] = useState('');
  const [planType, setPlanType] = useState<'mensal' | 'semestral' | 'anual'>('mensal');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      loadAlunos();

      // Se estiver editando, preencher os campos
      if (editingStudent) {
        setSelectedAluno(editingStudent.aluno_id);
        setPlanType(editingStudent.plan_type);
        setMonthlyValue(editingStudent.monthly_value?.toString() || '');
        setTotalValue(editingStudent.total_value?.toString() || '');
        setDueDay(editingStudent.due_day?.toString() || '');
        setStartDate(editingStudent.start_date || new Date().toISOString().split('T')[0]);
      } else {
        // Limpar formulário para novo cadastro
        setSelectedAluno('');
        setPlanType('mensal');
        setMonthlyValue('');
        setTotalValue('');
        setDueDay('');
        setStartDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, editingStudent]);

  const loadAlunos = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'aluno')
      .eq('approved', true)
      .order('full_name', { ascending: true });

    setAlunos(data || []);
  };

  // Calcular valor total automaticamente
  useEffect(() => {
    if (monthlyValue) {
      const monthly = parseFloat(monthlyValue);
      if (!isNaN(monthly)) {
        let total = monthly;
        if (planType === 'semestral') {
          total = monthly * 6;
        } else if (planType === 'anual') {
          total = monthly * 12;
        }
        setTotalValue(total.toFixed(2));
      }
    }
  }, [monthlyValue, planType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const alunoId = editingStudent ? editingStudent.aluno_id : selectedAluno;

      if (!alunoId || !monthlyValue || !totalValue || !dueDay) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Calcular data de fim
      const start = new Date(startDate);
      const endDate = new Date(start);
      if (planType === 'mensal') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'semestral') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (planType === 'anual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Calcular próxima data de vencimento
      const nextDueDate = new Date(start);
      nextDueDate.setDate(parseInt(dueDay));
      if (nextDueDate <= start) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const planData = {
        aluno_id: alunoId,
        plan_type: planType,
        monthly_value: parseFloat(monthlyValue),
        total_value: parseFloat(totalValue),
        start_date: startDate,
        due_day: parseInt(dueDay),
        next_due_date: nextDueDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        payment_confirmed: false,
      };

      if (editingStudent) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('student_plans')
          .update(planData)
          .eq('id', editingStudent.id);

        if (error) throw error;
        setToast({ type: 'success', message: 'Plano atualizado com sucesso!' });
      } else {
        // Criar novo plano
        const { error } = await supabase
          .from('student_plans')
          .insert(planData);

        if (error) throw error;
        setToast({ type: 'success', message: 'Plano criado com sucesso!' });
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      setToast({ type: 'error', message: error.message || 'Erro ao salvar plano' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingStudent ? 'Editar Plano' : 'Adicionar Plano Manual'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {editingStudent ? 'Atualizar informações do plano' : 'Cadastrar novo aluno no sistema de pagamentos'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Selecionar Aluno (apenas para novo cadastro) */}
            {!editingStudent && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <User size={16} />
                  Aluno *
                </label>
                <select
                  value={selectedAluno}
                  onChange={(e) => setSelectedAluno(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map(aluno => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.full_name || aluno.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipo de Plano */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Plano *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['mensal', 'semestral', 'anual'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPlanType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      planType === type
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-semibold ${planType === type ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valor Mensal (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valor Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalValue}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 cursor-not-allowed"
                  placeholder="Calculado automaticamente"
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={16} />
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dia de Vencimento *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Dia (1-31)"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>📝 Nota:</strong> Um pagamento pendente será criado automaticamente.
                Você poderá confirmar o pagamento depois mudando o método de pagamento.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <DollarSign size={18} />
                {loading ? 'Salvando...' : (editingStudent ? 'Atualizar Plano' : 'Criar Plano')}
              </button>
            </div>
          </form>
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
