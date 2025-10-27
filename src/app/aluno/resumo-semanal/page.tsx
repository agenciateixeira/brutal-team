import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import WeeklySummaryForm from '@/components/aluno/WeeklySummaryForm';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Função para calcular semana do mês
function getCurrentWeekOfMonth(): number {
  const today = new Date();
  const dayOfMonth = today.getDate();

  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  return 4;
}

export default async function ResumoSemanalPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar dados do aluno
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  // Calcular semana, mês e ano atuais
  const now = new Date();
  const currentWeek = getCurrentWeekOfMonth();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Verificar se já enviou resumo esta semana
  const { data: existingSummary } = await supabase
    .from('weekly_summary')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('week_of_month', currentWeek)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single();

  // Buscar último feedback do coach
  const { data: lastFeedback } = await supabase
    .from('weekly_summary')
    .select('*')
    .eq('aluno_id', session.user.id)
    .not('coach_feedback', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Verificar se feedback é recente (última semana)
  const showFeedback = lastFeedback && lastFeedback.coach_feedback_sent_at
    ? (new Date().getTime() - new Date(lastFeedback.coach_feedback_sent_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar profile={profile} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0 max-w-5xl">
          {/* Feedback do Coach */}
          {showFeedback && lastFeedback && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    Feedback do Coach
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Enviado em {new Date(lastFeedback.coach_feedback_sent_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-3">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {lastFeedback.coach_feedback}
                </p>
              </div>
            </div>
          )}

          {/* Já Enviou Esta Semana */}
          {existingSummary ? (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-xl p-8 text-center">
              <CheckCircle className="mx-auto text-green-600 dark:text-green-400 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
                Resumo Já Enviado!
              </h2>
              <p className="text-green-700 dark:text-green-400 mb-4">
                Você já enviou o resumo semanal desta semana.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enviado em: {new Date(existingSummary.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {existingSummary.task_completed ? (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                    <CheckCircle size={16} />
                    Revisado pelo coach
                  </p>
                ) : (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={16} />
                    Aguardando revisão do coach
                  </p>
                )}
              </div>

              <a
                href="/aluno/dashboard"
                className="inline-block mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                Voltar ao Dashboard
              </a>
            </div>
          ) : (
            /* Formulário */
            <WeeklySummaryForm
              alunoId={session.user.id}
              currentWeek={currentWeek}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          )}
        </div>
      </main>
    </div>
  );
}
