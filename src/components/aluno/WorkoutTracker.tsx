'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkoutTracking } from '@/types';
import { Calendar, Filter, CheckCircle, Circle } from 'lucide-react';
import { format, startOfDay, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface WorkoutTrackerProps {
  alunoId: string;
  workoutTypes?: string[];
}

type FilterPeriod = '7days' | '30days' | 'custom';

const workoutTypeLabels: Record<string, string> = {
  cardio: 'Cardio',
  musculacao: 'Musculação',
  luta: 'Luta',
  outros: 'Outros',
};

export default function WorkoutTracker({ alunoId, workoutTypes = ['musculacao'] }: WorkoutTrackerProps) {
  const [todayTracking, setTodayTracking] = useState<WorkoutTracking | null>(null);
  const [historicalData, setHistoricalData] = useState<WorkoutTracking[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const supabase = createClient();

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Carregar dados iniciais
  useEffect(() => {
    loadTodayTracking();
    loadHistoricalData();
  }, [alunoId, filterPeriod, customStartDate, customEndDate]);

  // Realtime subscription para auto-refresh
  useEffect(() => {
    console.log('💪 [WorkoutTracker] Iniciando subscription para:', alunoId);

    const channel = supabase
      .channel(`workout-tracking-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('💪 [WorkoutTracker] Workout tracking changed:', payload);
          // Recarrega dados quando houver mudança
          loadTodayTracking();
          loadHistoricalData();
        }
      )
      .subscribe((status) => {
        console.log('📡 [WorkoutTracker] Subscription status:', status);
      });

    return () => {
      console.log('🔌 [WorkoutTracker] Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [alunoId]);

  const loadTodayTracking = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_tracking')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setTodayTracking(data || null);
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

      setHistoricalData(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const toggleWorkout = async (workoutType: string) => {
    try {
      const currentCompleted = todayTracking?.workout_types_completed || [];
      const newCompleted = currentCompleted.includes(workoutType)
        ? currentCompleted.filter(t => t !== workoutType)
        : [...currentCompleted, workoutType];

      if (todayTracking) {
        // Atualizar existente
        const { error } = await supabase
          .from('workout_tracking')
          .update({ workout_types_completed: newCompleted })
          .eq('id', todayTracking.id);

        if (error) throw error;

        setTodayTracking({ ...todayTracking, workout_types_completed: newCompleted });
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('workout_tracking')
          .insert({
            aluno_id: alunoId,
            date: today,
            workout_types_completed: newCompleted,
          })
          .select()
          .single();

        if (error) throw error;

        setTodayTracking(data);
      }

      setToast({ type: 'success', message: 'Treino atualizado!' });
      loadHistoricalData();
    } catch (error: any) {
      console.error('Erro ao atualizar treino:', error);
      setToast({ type: 'error', message: `Erro ao atualizar: ${error.message}` });
    }
  };

  const isTypeCompleted = (workoutType: string) => {
    return todayTracking?.workout_types_completed?.includes(workoutType) || false;
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
            {(todayTracking?.workout_types_completed || []).length} de {workoutTypes.length} tipos
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workoutTypes.map((type) => {
            const isCompleted = isTypeCompleted(type);
            const label = workoutTypeLabels[type] || type;

            return (
              <button
                key={type}
                onClick={() => toggleWorkout(type)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Circle size={24} className="text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={20} className="text-primary-600" />
            Histórico
          </h3>

          <div className="flex gap-2 flex-wrap">
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
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
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
          {historicalData.map((tracking) => {
            const trackingDate = parseISO(tracking.date);
            const completedCount = (tracking.workout_types_completed || []).length;

            return (
              <div
                key={tracking.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {isToday(trackingDate)
                        ? 'Hoje'
                        : format(trackingDate, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(trackingDate, 'EEEE', { locale: ptBR })}
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    completedCount > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {completedCount} {completedCount === 1 ? 'tipo' : 'tipos'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {workoutTypes.map((type) => {
                    const isCompleted = (tracking.workout_types_completed || []).includes(type);
                    const label = workoutTypeLabels[type] || type;

                    return (
                      <div
                        key={type}
                        className={`flex items-center gap-2 p-2 rounded text-xs ${
                          isCompleted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Circle size={14} />
                        )}
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
