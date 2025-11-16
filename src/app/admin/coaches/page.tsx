import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  CreditCard,
  Users
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

export default async function AdminCoachesPage() {
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

  // Buscar todos os coaches com suas assinaturas
  const { data: coaches } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions(*)
    `)
    .eq('role', 'coach')
    .order('created_at', { ascending: false });

  // Buscar contagem de alunos por coach
  const { data: alunosCount } = await supabase
    .from('aluno_coach')
    .select('coach_id, aluno_id');

  // Mapear contagem de alunos por coach
  const alunosByCoach = alunosCount?.reduce((acc: any, item: any) => {
    acc[item.coach_id] = (acc[item.coach_id] || 0) + 1;
    return acc;
  }, {}) || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <CheckCircle size={12} />
            Ativo
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            <Clock size={12} />
            Trial
          </span>
        );
      case 'canceled':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            <XCircle size={12} />
            Cancelado
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
            <Clock size={12} />
            Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400">
            <XCircle size={12} />
            Sem assinatura
          </span>
        );
    }
  };

  const getPlanBadge = (priceId: string | null) => {
    if (!priceId) return <span className="text-xs text-gray-500">-</span>;

    // Identificar o plano baseado no price_id
    if (priceId.includes('month')) {
      return <span className="text-xs font-medium text-gray-900 dark:text-white">Mensal - R$ 49,90</span>;
    } else if (priceId.includes('year')) {
      return <span className="text-xs font-medium text-gray-900 dark:text-white">Anual - R$ 499,00</span>;
    }
    return <span className="text-xs text-gray-500">Plano personalizado</span>;
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gerenciar Coaches
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Lista completa de coaches cadastrados na plataforma
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total de Coaches
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {coaches?.length || 0}
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
                    Com Assinatura Ativa
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {coaches?.filter((c: any) =>
                      c.subscriptions?.some((s: any) => s.status === 'active' || s.status === 'trialing')
                    ).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Em Trial
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {coaches?.filter((c: any) =>
                      c.subscriptions?.some((s: any) => s.status === 'trialing')
                    ).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Sem Assinatura
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {coaches?.filter((c: any) =>
                      !c.subscriptions || c.subscriptions.length === 0 ||
                      c.subscriptions.every((s: any) => s.status === 'canceled' || s.status === 'cancelled')
                    ).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <XCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Coaches Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Todos os Coaches
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Coach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Alunos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {coaches?.map((coach: any) => {
                    const activeSubscription = coach.subscriptions?.find(
                      (s: any) => s.status === 'active' || s.status === 'trialing'
                    );
                    const latestSubscription = coach.subscriptions?.[0];
                    const subscription = activeSubscription || latestSubscription;

                    return (
                      <tr key={coach.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                              {coach.full_name?.[0]?.toUpperCase() || coach.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {coach.full_name || 'Sem nome'}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail size={12} />
                                {coach.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanBadge(subscription?.stripe_price_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(subscription?.status || 'none')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                            <Users size={16} />
                            <span className="font-semibold">{alunosByCoach[coach.id] || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            {new Date(coach.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
