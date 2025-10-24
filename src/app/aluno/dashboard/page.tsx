import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import ProgressChart from '@/components/aluno/ProgressChart';
import { TrendingUp, Calendar, Apple } from 'lucide-react';

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

  return (
    <div className="flex h-screen bg-white">
      <Sidebar profile={profile} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-700 mt-1">
                Bem-vindo de volta, {profile.full_name || 'Atleta'}!
              </p>
            </div>

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
    </div>
  );
}
