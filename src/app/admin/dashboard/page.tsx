import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RequireAdmin from '@/components/auth/RequireAdmin';
import {
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

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

  if (profile?.email !== ADMIN_EMAIL) {
    redirect(profile?.role === 'coach' ? '/coach/dashboard' : '/aluno/dashboard');
  }

  // Buscar estatísticas gerais
  const { data: coaches } = await supabase
    .from('profiles')
    .select('*, subscriptions(*)')
    .eq('role', 'coach');

  const { data: allPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'succeeded')
    .order('paid_at', { ascending: false });

  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      *,
      coach:coach_id(full_name, email),
      aluno:aluno_id(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // Calcular estatísticas
  const totalCoaches = coaches?.length || 0;
  const activeCoaches = coaches?.filter(c =>
    c.subscriptions?.some((s: any) => s.status === 'active' || s.status === 'trialing')
  ).length || 0;

  const totalRevenue = allPayments?.reduce((sum, p) => sum + p.platform_fee, 0) || 0;
  const monthlyRevenue = allPayments?.filter(p => {
    const paidDate = new Date(p.paid_at || p.created_at);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + p.platform_fee, 0) || 0;

  const totalTransactions = allPayments?.length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <CheckCircle size={12} />
            Pago
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
            <Clock size={12} />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            <XCircle size={12} />
            Falhou
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  return (
    <RequireAdmin profile={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visão geral completa da plataforma Brutal Team
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total de Coaches
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalCoaches}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {activeCoaches} ativos
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Receita Total (2%)
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    R\$ {(totalRevenue / 100).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Desde o início
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={24} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Receita Mensal
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    R\$ {(monthlyRevenue / 100).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mês atual
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Transações
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalTransactions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total processadas
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/admin/coaches"
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Gerenciar Coaches
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ver todos os coaches e assinaturas
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/transacoes"
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="text-green-600 dark:text-green-400" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Transações
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ver todas as transações
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/relatorios"
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Relatórios
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Análises e estatísticas
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transações Recentes
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Coach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Aluno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Taxa (2%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentPayments?.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(payment.paid_at || payment.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.coach?.full_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.coach?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.aluno?.full_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.aluno?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        R\$ {(payment.amount / 100).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        R\$ {(payment.platform_fee / 100).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
