'use client';

import { useState } from 'react';
import { Users, Clock, CheckCircle, AlertCircle, DollarSign, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ManagePaymentModal from './ManagePaymentModal';
import { useRouter } from 'next/navigation';

interface PaymentsListProps {
  students: any[];
  recentPayments: any[];
}

type TabType = 'students' | 'history';

export default function PaymentsList({ students, recentPayments }: PaymentsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingStudent(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        icon: CheckCircle,
        label: 'Ativo',
      },
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        icon: Clock,
        label: 'Pendente',
      },
      overdue: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        icon: AlertCircle,
        label: 'Atrasado',
      },
    };

    const style = styles[status as keyof typeof styles] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon size={14} />
        {style.label}
      </span>
    );
  };

  const getPlanBadge = (planType: string) => {
    const styles = {
      mensal: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
      semestral: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
      anual: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    };

    const style = styles[planType as keyof typeof styles] || styles.mensal;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {planType.charAt(0).toUpperCase() + planType.slice(1)}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header com botão de adicionar */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gerenciamento de Pagamentos
          </h3>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            Adicionar Plano Manual
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'students'
                ? 'border-primary-600 text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              Alunos Ativos ({students.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-primary-600 text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock size={18} />
              Histórico ({recentPayments.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'students' ? (
          <div className="space-y-3">
            {students.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum aluno ativo encontrado
              </p>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  {/* Info do Aluno */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {student.profiles?.full_name || student.profiles?.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {student.profiles?.email}
                      </p>
                      {/* Tags no mobile aparecem aqui embaixo do email */}
                      <div className="flex md:hidden items-center gap-2">
                        {getPlanBadge(student.plan_type)}
                        {getStatusBadge(student.profiles?.payment_status || 'pending')}
                      </div>
                    </div>
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                    {/* Tags no desktop aparecem aqui */}
                    <div className="hidden md:flex items-center gap-3">
                      {getPlanBadge(student.plan_type)}
                      {getStatusBadge(student.profiles?.payment_status || 'pending')}
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {student.monthly_value?.toFixed(2)}
                      </p>
                      {/* "por mês" só aparece no desktop */}
                      <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                        por mês
                      </p>
                    </div>

                    {/* Botão Editar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(student);
                      }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                      title="Editar plano"
                    >
                      <Edit size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum pagamento registrado
              </p>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {payment.profiles?.full_name || payment.profiles?.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.notes || 'Pagamento registrado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        R$ {payment.amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(payment.payment_date), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      payment.payment_method === 'Pendente'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {payment.payment_method || 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>

      {/* Modal de Gerenciamento */}
      <ManagePaymentModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        editingStudent={editingStudent}
        onSuccess={handleSuccess}
      />
    </>
  );
}
