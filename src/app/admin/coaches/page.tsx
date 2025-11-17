
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { PLANS } from '@/config/plans';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

const planLabels = PLANS.reduce<Record<string, string>>((acc, plan) => {
  acc[plan.id] = `${plan.name} - R$ ${plan.price.toFixed(2).replace('.', ',')}`;
  return acc;
}, {});

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

  const supabaseAdmin = createAdminSupabaseClient();

  const db = supabaseAdmin ?? supabase;
  const usingFallbackClient = !supabaseAdmin;

  const {
    data: coachesData,
    error: coachesError,
  } = await db
    .from('profiles')
    .select('id, full_name, email, created_at, stripe_subscription_status, subscription_plan, stripe_subscription_id')
    .eq('role', 'coach')
    .order('created_at', { ascending: false });

  const coaches = coachesData ?? [];

  const {
    data: coachStudentsData,
    error: coachStudentsError,
  } = await db
    .from('coach_students')
    .select('coach_id, status');

  const coachStudents = coachStudentsData ?? [];
  const dataError = coachesError || coachStudentsError;

  const studentsByCoach = coachStudents.reduce<Record<string, { total: number; active: number }>>((acc, record) => {
    const entry = acc[record.coach_id] || { total: 0, active: 0 };
    entry.total += 1;
    if (record.status === 'active') entry.active += 1;
    acc[record.coach_id] = entry;
    return acc;
  }, {});

  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter(({ stripe_subscription_status }) =>
    ['active', 'trialing'].includes(stripe_subscription_status || '')
  ).length;
  const trialingCoaches = coaches.filter(({ stripe_subscription_status }) => stripe_subscription_status === 'trialing').length;
  const noSubscriptionCoaches = totalCoaches - activeCoaches;

  const getStatusBadge = (status: string | null) => {
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
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
            <Clock size={12} />
            Vencido
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
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400">
            <XCircle size={12} />
            Sem assinatura
          </span>
        );
    }
  };

  const getPlanBadge = (planId: string | null) => {
    if (!planId) return <span className="text-xs text-gray-500">Sem plano</span>;
    return <span className="text-xs font-medium text-gray-900 dark:text-white">{planLabels[planId] || 'Plano personalizado'}</span>;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <AdminLayout profile={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
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

          {dataError && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
              <p className="font-semibold">Não conseguimos carregar todos os coaches agora.</p>
              <p className="mt-1 text-xs opacity-80">{dataError.message}</p>
              {usingFallbackClient && (
                <p className="mt-1 text-xs opacity-80">
                  Verifique se a variável <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> está configurada para liberar o acesso administrativo completo.
                </p>
              )}
            </div>
          )}

          {!dataError && usingFallbackClient && (
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              <p className="font-semibold">Listando com permissões limitadas.</p>
              <p className="text-xs opacity-80">
                Configure <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> para enxergar todos os coaches sem as restrições de RLS dos dados.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total de Coaches" value={totalCoaches} icon={Users} description="Cadastrados" />
            <StatCard title="Com assinatura ativa" value={activeCoaches} icon={CheckCircle} description="Status ativo / trial" />
            <StatCard title="Em trial" value={trialingCoaches} icon={Clock} description="Período de teste" />
            <StatCard title="Sem assinatura" value={noSubscriptionCoaches} icon={XCircle} description="Necessita ativação" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Coaches cadastrados</h2>
                <p className="text-sm text-gray-500">Gerencie assinaturas e alunos vinculados</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide">Coach</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide">Alunos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide">Assinatura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {coaches.map((coach) => {
                    const status = coach.stripe_subscription_status || 'none';
                    const alunos = studentsByCoach[coach.id] || { total: 0, active: 0 };
                    return (
                      <tr key={coach.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{coach.full_name || coach.email}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail size={12} /> {coach.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{getPlanBadge(coach.subscription_plan)}</div>
                          <div className="mt-1 text-xs text-gray-500">ID: {coach.subscription_plan || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{alunos.active} ativos</div>
                          <div className="text-xs text-gray-500">{alunos.total} no total</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="mb-1">{getStatusBadge(status)}</div>
                          {coach.stripe_subscription_id && (
                            <div className="text-xs text-gray-500">ID: {coach.stripe_subscription_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Calendar size={14} />
                            {formatDate(coach.created_at)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {coaches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        Nenhum coach cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="w-12 h-12 bg-blue-100/70 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Icon size={24} className="text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
}
