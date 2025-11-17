import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { formatCentsToBRL } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

export default async function AdminTransacoesPage() {
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

  const adminClient = createAdminSupabaseClient();
  const db = adminClient ?? supabase;
  const usingFallbackClient = !adminClient;

  // Buscar todas as transações
  const { data: allPaymentsData, error: paymentsError } = await db
    .from('payments')
    .select(`
      *,
      coach:coach_id(full_name, email),
      aluno:aluno_id(full_name, email)
    `)
    .order('created_at', { ascending: false });

  const allPayments = allPaymentsData ?? [];

  // Calcular estatísticas
  const totalTransactions = allPayments?.length || 0;
  const succeededPayments = allPayments?.filter(p => p.status === 'succeeded') || [];
  const pendingPayments = allPayments?.filter(p => p.status === 'pending') || [];
  const failedPayments = allPayments?.filter(p => p.status === 'failed') || [];

  const totalRevenue = succeededPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0);
  const totalVolume = succeededPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Receita do mês atual
  const now = new Date();
  const monthlyRevenue = succeededPayments.filter(p => {
    const paymentDate = new Date(p.paid_at || p.created_at);
    return paymentDate.getMonth() === now.getMonth() &&
           paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.platform_fee || 0), 0);

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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'pix':
        return '🔷';
      case 'boleto':
        return '📄';
      default:
        return '💰';
    }
  };

  return (
    <AdminLayout profile={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/dashboard"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2 inline-block"
            >
              ← Voltar ao Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Transações da Plataforma
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Histórico completo de todas as transações processadas pela Stripe
                </p>
              </div>
            </div>
          </div>

          {paymentsError && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              <p className="font-semibold">Não conseguimos carregar todas as transações.</p>
              <p className="text-xs opacity-80 mt-1">{paymentsError.message}</p>
            </div>
          )}

          {!paymentsError && usingFallbackClient && (
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
              <p className="font-semibold">Listando com permissões limitadas.</p>
              <p className="text-xs opacity-80">
                Configure <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> para garantir a visão completa das transações.
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Receita Total (2%)
                </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCentsToBRL(totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Volume: {formatCentsToBRL(totalVolume)}
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
                    {formatCentsToBRL(monthlyRevenue)}
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
                    Total de Transações
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalTransactions}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {succeededPayments.length} pagas
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Pendentes/Falhas
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {pendingPayments.length + failedPayments.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {pendingPayments.length} pendentes, {failedPayments.length} falhas
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Todas as Transações
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
                      Método
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
                  {allPayments?.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(payment.paid_at || payment.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg" title={payment.payment_method}>
                          {getPaymentMethodIcon(payment.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCentsToBRL(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCentsToBRL(payment.platform_fee)}
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
    </AdminLayout>
  );
}
