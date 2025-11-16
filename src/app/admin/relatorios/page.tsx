'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { Profile } from '@/types';

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

export default function AdminRelatoriosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);

  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('all'); // all, today, week, month, year, custom

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData?.email !== ADMIN_EMAIL) {
          router.push(profileData?.role === 'coach' ? '/coach/dashboard' : '/aluno/dashboard');
          return;
        }

        setProfile(profileData);

        // Buscar dados
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: coachesData } = await supabase
          .from('profiles')
          .select('*, subscriptions(*)')
          .eq('role', 'coach');

        const { data: alunosData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'aluno');

        setPayments(paymentsData || []);
        setCoaches(coachesData || []);
        setAlunos(alunosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Aplicar filtros de data
  const getFilteredPayments = () => {
    let filtered = payments;

    if (period !== 'all') {
      const now = new Date();
      let filterDate = new Date();

      switch (period) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = payments.filter(p => new Date(p.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = payments.filter(p => new Date(p.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = payments.filter(p => new Date(p.created_at) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = payments.filter(p => new Date(p.created_at) >= filterDate);
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = payments.filter(p => {
              const date = new Date(p.created_at);
              return date >= start && date <= end;
            });
          }
          break;
      }
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();
  const succeededPayments = filteredPayments.filter(p => p.status === 'succeeded');

  // Calcular estatísticas
  const totalRevenue = succeededPayments.reduce((sum, p) => sum + (p.platform_fee || 0), 0);
  const totalVolume = succeededPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTransactions = filteredPayments.length;
  const avgTicket = succeededPayments.length > 0 ? totalVolume / succeededPayments.length : 0;

  // Calcular crescimento mensal
  const currentMonth = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(currentMonth.getMonth() - 1);

  const currentMonthRevenue = payments.filter(p => {
    const date = new Date(p.created_at);
    return p.status === 'succeeded' &&
           date.getMonth() === currentMonth.getMonth() &&
           date.getFullYear() === currentMonth.getFullYear();
  }).reduce((sum, p) => sum + (p.platform_fee || 0), 0);

  const lastMonthRevenue = payments.filter(p => {
    const date = new Date(p.created_at);
    return p.status === 'succeeded' &&
           date.getMonth() === lastMonth.getMonth() &&
           date.getFullYear() === lastMonth.getFullYear();
  }).reduce((sum, p) => sum + (p.platform_fee || 0), 0);

  const growth = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Agrupar por mês para gráfico
  const monthlyData = payments
    .filter(p => p.status === 'succeeded')
    .reduce((acc: any, payment) => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          revenue: 0,
          volume: 0,
          count: 0
        };
      }

      acc[monthKey].revenue += payment.platform_fee || 0;
      acc[monthKey].volume += payment.amount || 0;
      acc[monthKey].count += 1;

      return acc;
    }, {});

  const monthlyChartData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12); // Últimos 12 meses

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <AdminLayout profile={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <a
              href="/admin/dashboard"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-2 inline-block"
            >
              ← Voltar ao Dashboard
            </a>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Relatórios e Análises
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análise completa da receita e transações da plataforma
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filtros de Período
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período Rápido
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Último mês</option>
                  <option value="year">Último ano</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {period === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Receita (2%)
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    R$ {(totalRevenue / 100).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Volume: R$ {(totalVolume / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    Crescimento Mensal
                  </p>
                  <p className={`text-3xl font-bold ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    vs mês anterior
                  </p>
                </div>
                <div className={`w-12 h-12 ${growth >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} rounded-lg flex items-center justify-center`}>
                  {growth >= 0 ? (
                    <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown size={24} className="text-red-600 dark:text-red-400" />
                  )}
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
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {succeededPayments.length} bem-sucedidas
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
                    Ticket Médio
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    R$ {(avgTicket / 100).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Por transação
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Receita Mensal (Últimos 12 meses)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {monthlyChartData.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyChartData.map((data: any) => {
                      const maxRevenue = Math.max(...monthlyChartData.map((d: any) => d.revenue));
                      const percentage = (data.revenue / maxRevenue) * 100;

                      return (
                        <div key={data.month} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(data.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full flex items-center justify-end px-3 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage > 15 && (
                                  <span className="text-xs font-semibold text-white">
                                    R$ {(data.revenue / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-32 text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {data.count} transações
                            </div>
                            <div className="text-xs text-gray-500">
                              Vol: R$ {(data.volume / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Users Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Coaches
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{coaches.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Ativos</span>
                  <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {coaches.filter((c: any) =>
                      c.subscriptions?.some((s: any) => s.status === 'active' || s.status === 'trialing')
                    ).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alunos
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{alunos.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
