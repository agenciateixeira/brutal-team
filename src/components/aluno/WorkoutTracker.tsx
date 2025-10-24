'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkoutTracking } from '@/types';
import { Calendar, Filter, CheckCircle, Circle, Sunrise, Sun, Moon } from 'lucide-react';
import { format, startOfDay, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface WorkoutTrackerProps {
  alunoId: string;
}

type FilterPeriod = '7days' | '30days' | 'custom';

const periods = [
  { key: 'manha', label: 'Manhã', icon: Sunrise },
  { key: 'tarde', label: 'Tarde', icon: Sun },
  { key: 'noite', label: 'Noite', icon: Moon },
] as const;

export default function WorkoutTracker({ alunoId }: WorkoutTrackerProps) {
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutTracking[]>([]);
  const [historicalData, setHistoricalData] = useState<Map<string, WorkoutTracking[]>>(new Map());
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const supabase = createClient();

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Carregar dados iniciais
  useEffect(() => {
    loadTodayWorkouts();
    loadHistoricalData();
  }, [alunoId, filterPeriod, customStartDate, customEndDate]);

  const loadTodayWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_tracking')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('date', today);

      if (error) throw error;

      setTodayWorkouts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar treinos de hoje:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      let startDate: string;
      let endDate = today;

      if (filterPeriod === '7days') {
        startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      } else if (filterPeriod === '30days') {
        startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      } else {
        if (!customStartDate || !customEndDate) return;
        startDate = customStartDate;
        endDate = customEndDate;
      }

      const { data, error } = await supabase
        .from('workout_tracking')
        .select('*')
        .eq('aluno_id', alunoId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Agrupar por data
      const grouped = new Map<string, WorkoutTracking[]>();
      data?.forEach((workout) => {
        if (!grouped.has(workout.date)) {
          grouped.set(workout.date, []);
        }
        grouped.get(workout.date)!.push(workout);
      });

      setHistoricalData(grouped);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const toggleWorkout = async (period: string) => {
    try {
      const existing = todayWorkouts.find(w => w.period === period);

      if (existing) {
        // Atualizar existente
        const newCompleted = !existing.completed;
        const { error } = await supabase
          .from('workout_tracking')
          .update({ completed: newCompleted })
          .eq('id', existing.id);

        if (error) throw error;

        setTodayWorkouts(todayWorkouts.map(w =>
          w.id === existing.id ? { ...w, completed: newCompleted } : w
        ));
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('workout_tracking')
          .insert({
            aluno_id: alunoId,
            date: today,
            period,
            completed: true,
          })
          .select()
          .single();

        if (error) throw error;

        setTodayWorkouts([...todayWorkouts, data]);
      }

      setToast({ type: 'success', message: 'Treino atualizado!' });
      loadHistoricalData();
    } catch (error: any) {
      console.error('Erro ao atualizar treino:', error);
      setToast({ type: 'error', message: `Erro ao atualizar: ${error.message}` });
    }
  };

  const isPeriodCompleted = (period: string) => {
    return todayWorkouts.some(w => w.period === period && w.completed);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Tracking de Hoje */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-primary-600" />
            Hoje - {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {todayWorkouts.filter(w => w.completed).length} de {periods.length} períodos
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {periods.map((period) => {
            const isCompleted = isPeriodCompleted(period.key);
            const Icon = period.icon;

            return (
              <button
                key={period.key}
                onClick={() => toggleWorkout(period.key)}
                className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <Icon
                  size={32}
                  className={isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}
                />
                <span className={`text-sm font-medium ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {period.label}
                </span>
                {isCompleted ? (
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                ) : (
                  <Circle size={20} className="text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={20} className="text-primary-600" />
            Histórico
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterPeriod('7days')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterPeriod === '7days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setFilterPeriod('30days')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterPeriod === '30days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setFilterPeriod('custom')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterPeriod === 'custom'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Filtro Personalizado */}
        {filterPeriod === 'custom' && (
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                De
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Até
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Lista de Dias */}
        <div className="space-y-3">
          {Array.from(historicalData.entries()).map(([date, workouts]) => {
            const workoutDate = parseISO(date);
            const completedCount = workouts.filter(w => w.completed).length;

            return (
              <div
                key={date}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {isToday(workoutDate)
                        ? 'Hoje'
                        : format(workoutDate, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(workoutDate, 'EEEE', { locale: ptBR })}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    completedCount > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {completedCount} {completedCount === 1 ? 'treino' : 'treinos'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {periods.map((period) => {
                    const workout = workouts.find(w => w.period === period.key);
                    const isCompleted = workout?.completed || false;
                    const Icon = period.icon;

                    return (
                      <div
                        key={period.key}
                        className={`flex items-center gap-2 p-2 rounded text-xs ${
                          isCompleted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <Icon size={14} />
                        <span className="truncate">{period.label}</span>
                        {isCompleted && <CheckCircle size={12} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {historicalData.size === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum registro encontrado para o período selecionado
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
