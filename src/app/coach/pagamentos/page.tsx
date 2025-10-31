import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PaymentsChart from '@/components/coach/PaymentsChart';
import PaymentsList from '@/components/coach/PaymentsList';

// Forçar revalidação em cada request (sem cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoachPagamentosPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar dados do coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  // Buscar planos ativos para o gráfico
  const { data: plans } = await supabase
    .from('student_plans')
    .select('*')
    .eq('is_active', true);

  // Contar planos por tipo
  const plansByType = {
    mensal: plans?.filter(p => p.plan_type === 'mensal').length || 0,
    semestral: plans?.filter(p => p.plan_type === 'semestral').length || 0,
    anual: plans?.filter(p => p.plan_type === 'anual').length || 0,
  };

  // Buscar histórico de pagamentos recente
  const { data: recentPayments } = await supabase
    .from('payment_history')
    .select(`
      *,
      profiles!payment_history_aluno_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  // Buscar alunos com planos ativos
  const { data: activeStudents } = await supabase
    .from('student_plans')
    .select(`
      *,
      profiles!student_plans_aluno_id_fkey (
        id,
        full_name,
        email,
        payment_status
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pagamentos
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              Gerenciamento de pagamentos e planos dos alunos
            </p>
          </div>

          {/* Gráfico de Distribuição de Planos */}
          <PaymentsChart plansByType={plansByType} />

          {/* Lista de Alunos Ativos */}
          <PaymentsList
            students={activeStudents || []}
            recentPayments={recentPayments || []}
          />
        </div>
      </div>
    </AppLayout>
  );
}
