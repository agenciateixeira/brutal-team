import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import { Users, DollarSign, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import PaymentManagement from '@/components/admin/PaymentManagement';

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  // Buscar todos os alunos com informações de pagamento
  const { data: alunos } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .order('created_at', { ascending: false });

  // Calcular estatísticas
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const totalAlunos = alunos?.length || 0;

  const alunosAtivos = alunos?.filter(a =>
    a.payment_status === 'active' || a.payment_status === null
  ).length || 0;

  const alunosInadimplentes = alunos?.filter(a =>
    a.payment_status === 'overdue' || a.payment_status === 'pending'
  ).length || 0;

  // Buscar pagamentos do mês atual
  const { data: pagamentosMesAtual } = await supabase
    .from('payment_history')
    .select('*')
    .eq('reference_month', currentMonth);

  const alunosPagaramMes = pagamentosMesAtual?.length || 0;

  const receitaMensal = pagamentosMesAtual?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar profile={profile} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie pagamentos e visualize estatísticas dos alunos
              </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {/* Total de Alunos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total de Alunos
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {totalAlunos}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </div>

              {/* Alunos Ativos */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Alunos Ativos
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {alunosAtivos}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </div>

              {/* Inadimplentes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Inadimplentes
                    </p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {alunosInadimplentes}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                </div>
              </div>

              {/* Pagaram Este Mês */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Pagaram este Mês
                    </p>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {alunosPagaramMes}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <TrendingUp className="text-primary-600 dark:text-primary-400" size={24} />
                  </div>
                </div>
              </div>

              {/* Receita Mensal */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Receita do Mês
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      R$ {receitaMensal.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Componente de Gerenciamento de Pagamentos */}
            <PaymentManagement alunos={alunos || []} />
          </div>
        </div>
      </main>
    </div>
  );
}
