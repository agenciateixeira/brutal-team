'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MealTracking } from '@/types';
import { Calendar, Filter, CheckCircle, Circle } from 'lucide-react';
import { format, startOfDay, subDays, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface MealTrackerProps {
  alunoId: string;
  mealsPerDay?: number;
}

type FilterPeriod = '7days' | '30days' | 'custom';

export default function MealTracker({ alunoId, mealsPerDay = 6 }: MealTrackerProps) {
  // Gerar array dinâmico de refeições baseado em mealsPerDay
  const meals = Array.from({ length: mealsPerDay }, (_, i) => ({
    index: i,
    label: `Refeição ${i + 1}`
  }));
  const [todayTracking, setTodayTracking] = useState<MealTracking | null>(null);
  const [historicalTracking, setHistoricalTracking] = useState<MealTracking[]>([]);
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

  const loadTodayTracking = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_tracking')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setTodayTracking(data || null);
    } catch (error: any) {
      console.error('Erro ao carregar tracking de hoje:', error);
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
        .from('meal_tracking')
        .select('*')
        .eq('aluno_id', alunoId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      setHistoricalTracking(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const toggleMeal = async (mealIndex: number) => {
    try {
      const currentCompleted = (todayTracking?.meals_completed as any) || [];
      const newCompleted = currentCompleted.includes(mealIndex)
        ? currentCompleted.filter((i: number) => i !== mealIndex)
        : [...currentCompleted, mealIndex];

      if (todayTracking) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('meal_tracking')
          .update({ meals_completed: newCompleted })
          .eq('id', todayTracking.id);

        if (error) throw error;

        setTodayTracking({ ...todayTracking, meals_completed: newCompleted as any });
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from('meal_tracking')
          .insert({
            aluno_id: alunoId,
            date: today,
            meals_completed: newCompleted,
          })
          .select()
          .single();

        if (error) throw error;

        setTodayTracking(data);
      }

      setToast({ type: 'success', message: 'Refeição atualizada!' });
      loadHistoricalData();
    } catch (error: any) {
      console.error('Erro ao atualizar refeição:', error);
      setToast({ type: 'error', message: `Erro ao atualizar: ${error.message}` });
    }
  };

  const calculateDayCompletion = (tracking: MealTracking) => {
    const completed = (tracking.meals_completed as any || []).length;
    return Math.round((completed / mealsPerDay) * 100);
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
            {calculateDayCompletion(todayTracking || {} as MealTracking)}% completo
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meals.map((meal) => {
            const completedMeals = (todayTracking?.meals_completed as any) || [];
            const isChecked = completedMeals.includes(meal.index);
            return (
              <button
                key={meal.index}
                onClick={() => toggleMeal(meal.index)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  isChecked
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                {isChecked ? (
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Circle size={24} className="text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  isChecked
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {meal.label}
                </span>
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
          {historicalTracking.map((tracking) => {
            const trackingDate = parseISO(tracking.date);
            const completion = calculateDayCompletion(tracking);

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
                    completion === 100
                      ? 'text-green-600 dark:text-green-400'
                      : completion >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {completion}%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {meals.map((meal) => {
                    const completedMeals = (tracking.meals_completed as any) || [];
                    const isChecked = completedMeals.includes(meal.index);
                    return (
                      <div
                        key={meal.index}
                        className={`flex items-center gap-2 p-2 rounded text-xs ${
                          isChecked
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Circle size={14} />
                        )}
                        <span className="truncate">{meal.label}</span>
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
