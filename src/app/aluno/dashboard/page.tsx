import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import BottomNavigation from '@/components/ui/BottomNavigation';
import ProgressChart from '@/components/aluno/ProgressChart';
import WeeklySummary from '@/components/aluno/WeeklySummary';
import MonthlyPhotoProgress from '@/components/aluno/MonthlyPhotoProgress';
import DashboardWithFirstAccess from '@/components/aluno/DashboardWithFirstAccess';
import WelcomeMessage from '@/components/aluno/WelcomeMessage';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { TrendingUp, Calendar, Apple, AlertCircle, FileQuestion, Bell, Sparkles, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function AlunoDashboard() {
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

  // Buscar dieta e treino ativos
  const { data: dietaAtiva } = await supabase
    .from('dietas')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  const { data: treinoAtivo } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  const { data: protocoloAtivo } = await supabase
    .from('protocolos_hormonais')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  const showWelcomeMessage = !dietaAtiva || !treinoAtivo;

  // Verificar se há atualizações não visualizadas (explicitamente false, não null)
  const hasDietaUpdate = dietaAtiva && dietaAtiva.viewed_by_aluno === false;
  const hasTreinoUpdate = treinoAtivo && treinoAtivo.viewed_by_aluno === false;
  const hasProtocoloUpdate = protocoloAtivo && protocoloAtivo.viewed_by_aluno === false;

  const updatesCount = [hasDietaUpdate, hasTreinoUpdate, hasProtocoloUpdate].filter(Boolean).length;

  // Buscar lembretes de vencimento (3 dias antes)
  const { data: paymentReminders } = await supabase
    .from('payment_reminders')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('sent', false)
    .gte('reminder_date', new Date().toISOString().split('T')[0])
    .lte('reminder_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  const hasPaymentReminder = paymentReminders && paymentReminders.length > 0;
  const reminderData = hasPaymentReminder ? paymentReminders[0] : null;

  // Buscar fotos de progresso para o gráfico
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('week_number', { ascending: true });

  // Buscar dados do ano inteiro para progresso anual
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysPassedInYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Buscar meal tracking do ano
  const { data: mealTracking } = await supabase
    .from('meal_tracking')
    .select('*')
    .eq('aluno_id', session.user.id)
    .gte('date', startOfYear.toISOString().split('T')[0]);

  // Buscar workout tracking do ano
  const { data: workoutTracking } = await supabase
    .from('workout_tracking')
    .select('*')
    .eq('aluno_id', session.user.id)
    .gte('date', startOfYear.toISOString().split('T')[0]);

  // Calcular % de conclusão de refeições
  // 6 refeições por dia * dias passados no ano
  const expectedMeals = daysPassedInYear * 6;
  let completedMeals = 0;
  mealTracking?.forEach((day) => {
    if (day.cafe_da_manha) completedMeals++;
    if (day.lanche_manha) completedMeals++;
    if (day.almoco) completedMeals++;
    if (day.lanche_tarde) completedMeals++;
    if (day.janta) completedMeals++;
    if (day.ceia) completedMeals++;
  });
  const mealCompletionPercentage = Math.round((completedMeals / expectedMeals) * 100);

  // Calcular % de conclusão de treinos
  // 3 períodos por dia * dias passados no ano
  const expectedWorkouts = daysPassedInYear * 3;
  const completedWorkouts = workoutTracking?.filter(w => w.completed).length || 0;
  const workoutCompletionPercentage = Math.round((completedWorkouts / expectedWorkouts) * 100);

  // Progresso anual combinado (média de refeições e treinos)
  const overallCompletionPercentage = Math.round((mealCompletionPercentage + workoutCompletionPercentage) / 2);

  // Se o aluno tem fotos antigas, considerar primeiro acesso como completo
  const hasOldPhotos = photos && photos.length > 0;
  const shouldShowFirstAccessModal = !profile.first_access_completed && !hasOldPhotos;

  // Verificar se o aluno completou o questionário (anamnese)
  const { data: anamneseResponse } = await supabase
    .from('anamnese_responses')
    .select('id, completed')
    .or(`temp_email.eq.${profile.email}`)
    .maybeSingle();

  const hasCompletedQuestionnaire = anamneseResponse && anamneseResponse.completed;

  // Buscar observação pública do coach (últimos 7 dias)
  const { data: coachObservation } = await supabase
    .from('weekly_summary')
    .select('coach_public_observation, coach_public_observation_sent_at')
    .eq('aluno_id', session.user.id)
    .not('coach_public_observation', 'is', null)
    .not('coach_public_observation_sent_at', 'is', null)
    .order('coach_public_observation_sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Verificar se a observação foi enviada nos últimos 7 dias
  let showCoachObservation = false;
  if (coachObservation?.coach_public_observation_sent_at) {
    const sentDate = new Date(coachObservation.coach_public_observation_sent_at);
    const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
    showCoachObservation = daysSinceSent < 7;
  }

  return (
    <DashboardWithFirstAccess
      alunoId={session.user.id}
      initialFirstAccessCompleted={!shouldShowFirstAccessModal}
    >
      <div className="flex h-screen bg-white">
        <Sidebar profile={profile} />

        {/* Pull to Refresh */}
        <PullToRefresh />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0 pb-24 md:pb-8">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-700 mt-1">
                  Bem-vindo de volta, {profile.full_name || 'Atleta'}!
                </p>
              </div>

              {/* Mensagem de Boas-Vindas (7 dias) */}
              {showWelcomeMessage && <WelcomeMessage type="dashboard" />}

              {/* Aviso de Vencimento */}
              {hasPaymentReminder && reminderData && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Lembrete de Pagamento
                      </h3>
                      <p className="text-yellow-700 dark:text-yellow-200">
                        Sua mensalidade vence em {new Date(reminderData.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        ({reminderData.days_before} {reminderData.days_before === 1 ? 'dia' : 'dias'} restantes).
                        Não esqueça de realizar o pagamento para manter seu acesso ativo!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Questionário Não Preenchido */}
              {!hasCompletedQuestionnaire && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileQuestion className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        Complete seu Questionário
                      </h3>
                      <p className="text-blue-700 dark:text-blue-200 mb-3">
                        Seu coach precisa das informações do questionário para montar sua dieta e treino personalizados.
                        Preencha agora para acelerar o processo!
                      </p>
                      <Link
                        href="/questionario"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <FileQuestion size={18} />
                        Preencher Questionário
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Notificação de Atualizações */}
              {updatesCount > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-2 border-orange-400 dark:border-orange-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="text-orange-600 dark:text-orange-400" size={20} />
                        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300">
                          Nova Atualização Disponível!
                        </h3>
                      </div>
                      {updatesCount === 3 ? (
                        <p className="text-orange-800 dark:text-orange-200 leading-relaxed text-base">
                          {profile.full_name || 'Atleta'}, seu coach fez atualização nos seus treinos, dieta e protocolo.
                          Acesse-os para verificar já e manter a sua evolução em dia!
                        </p>
                      ) : (
                        <p className="text-orange-800 dark:text-orange-200 leading-relaxed text-base">
                          {profile.full_name || 'Atleta'},
                          {hasDietaUpdate && !hasTreinoUpdate && !hasProtocoloUpdate && ' sua dieta foi atualizada, acesse a página da dieta e verifique.'}
                          {hasTreinoUpdate && !hasDietaUpdate && !hasProtocoloUpdate && ' seu treino foi atualizado, acesse a página do treino e verifique.'}
                          {hasProtocoloUpdate && !hasDietaUpdate && !hasTreinoUpdate && ' seu protocolo foi atualizado, acesse a página do protocolo e verifique.'}
                          {updatesCount === 2 && hasDietaUpdate && hasTreinoUpdate && ' sua dieta e seu treino foram atualizados. Acesse as páginas para verificar!'}
                          {updatesCount === 2 && hasDietaUpdate && hasProtocoloUpdate && ' sua dieta e seu protocolo foram atualizados. Acesse as páginas para verificar!'}
                          {updatesCount === 2 && hasTreinoUpdate && hasProtocoloUpdate && ' seu treino e seu protocolo foram atualizados. Acesse as páginas para verificar!'}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {hasDietaUpdate && (
                          <Link
                            href="/aluno/dieta"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            <Apple size={16} />
                            Ver Dieta
                          </Link>
                        )}
                        {hasTreinoUpdate && (
                          <Link
                            href="/aluno/treino"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            <TrendingUp size={16} />
                            Ver Treino
                          </Link>
                        )}
                        {hasProtocoloUpdate && (
                          <Link
                            href="/aluno/protocolo"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            <Activity size={16} />
                            Ver Protocolo
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Observação do Coach (7 dias) */}
              {showCoachObservation && coachObservation && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-400 dark:border-purple-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">💬</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-2">
                        Mensagem do seu Coach
                      </h3>
                      <p className="text-purple-800 dark:text-purple-200 leading-relaxed text-base">
                        {coachObservation.coach_public_observation}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
                        📅 Enviado em {new Date(coachObservation.coach_public_observation_sent_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Summary - Resumo Semanal */}
              <WeeklySummary alunoId={session.user.id} />

              {/* Monthly Photo Progress - Progresso Mensal de Fotos */}
              <MonthlyPhotoProgress alunoId={session.user.id} />

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total de Fotos */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Fotos de Progresso
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {photos?.length || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-primary-600 dark:text-primary-400" size={24} />
                    </div>
                  </div>
                </div>

                {/* Semanas de Progresso */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Semanas de Treino
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {photos && photos.length > 0 ? Math.max(...photos.map(p => p.week_number)) : 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="text-secondary-600 dark:text-secondary-400" size={24} />
                    </div>
                  </div>
                </div>

                {/* Progresso Anual */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Progresso Anual
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {overallCompletionPercentage}%
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          🍎 Dieta: {mealCompletionPercentage}% ({completedMeals}/{expectedMeals})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          💪 Treino: {workoutCompletionPercentage}% ({completedWorkouts}/{expectedWorkouts})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Dia {daysPassedInYear} de 365
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Apple className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Progresso */}
              <ProgressChart photos={photos || []} />
            </div>
          </div>
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation profile={profile} />
      </div>
    </DashboardWithFirstAccess>
  );
}
