'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, TrendingUp, TrendingDown, Minus, Flame, Target } from 'lucide-react';

interface WeeklySummaryProps {
  alunoId: string;
}

interface Statistics {
  refeicoes_percentage: number;
  treinos_percentage: number;
  protocolos_percentage: number;
  current_streak: number;
  best_streak: number;
  total_days_tracked: number;
  last_7_days_percentage: number;
  last_30_days_percentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface TodaySummary {
  meals_completed: number;
  meals_total: number;
  workouts_completed: number;
  workouts_total: number;
}

export default function WeeklySummary({ alunoId }: WeeklySummaryProps) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStatistics();

    // Subscribe to realtime changes in tracking tables with unique channel names
    const mealChannel = supabase
      .channel(`weekly-meal-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('🍎 [WeeklySummary] Meal tracking changed:', payload);
          // Reload statistics when meal tracking changes
          loadStatistics();
        }
      )
      .subscribe((status) => {
        console.log('📡 [WeeklySummary] Meal tracking subscription status:', status);
      });

    const workoutChannel = supabase
      .channel(`weekly-workout-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('💪 [WeeklySummary] Workout tracking changed:', payload);
          // Reload statistics when workout tracking changes
          loadStatistics();
        }
      )
      .subscribe((status) => {
        console.log('📡 [WeeklySummary] Workout tracking subscription status:', status);
      });

    const protocolChannel = supabase
      .channel(`weekly-protocol-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'protocol_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('💊 [WeeklySummary] Protocol tracking changed:', payload);
          // Reload statistics when protocol tracking changes
          loadStatistics();
        }
      )
      .subscribe((status) => {
        console.log('📡 [WeeklySummary] Protocol tracking subscription status:', status);
      });

    return () => {
      supabase.removeChannel(mealChannel);
      supabase.removeChannel(workoutChannel);
      supabase.removeChannel(protocolChannel);
    };
  }, [alunoId]);

  const loadStatistics = async () => {
    try {
      // Carrega estatísticas gerais
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_aluno_statistics', { aluno_user_id: alunoId });

      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Carrega resumo de hoje
      const { data: todayData, error: todayError } = await supabase
        .rpc('get_today_summary', { aluno_user_id: alunoId });

      if (todayError) throw todayError;
      if (todayData && todayData.length > 0) {
        setToday(todayData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!stats) return null;

    switch (stats.trend) {
      case 'improving':
        return <TrendingUp size={20} className="text-green-600" />;
      case 'declining':
        return <TrendingDown size={20} className="text-red-600" />;
      default:
        return <Minus size={20} className="text-gray-600" />;
    }
  };

  const getTrendText = () => {
    if (!stats) return '';

    switch (stats.trend) {
      case 'improving':
        return 'Melhorando';
      case 'declining':
        return 'Precisa atenção';
      default:
        return 'Estável';
    }
  };

  const getTrendColor = () => {
    if (!stats) return 'text-gray-600';

    switch (stats.trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {currentDate}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seu progresso em tempo real
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {getTrendText()}
            </span>
          </div>
        )}
      </div>

      {/* Hoje */}
      {today && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            HOJE
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {today.meals_completed}/{today.meals_total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                refeições
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {today.workouts_completed}/{today.workouts_total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                treinos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas dos últimos 30 dias */}
      {stats && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            ÚLTIMOS 30 DIAS
          </h3>

          <div className="space-y-4 mb-6">
            {/* Refeições */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Refeições
                </span>
                <span className={`text-sm font-semibold ${getProgressTextColor(stats.refeicoes_percentage)}`}>
                  {stats.refeicoes_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(stats.refeicoes_percentage)}`}
                  style={{ width: `${Math.min(stats.refeicoes_percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Treinos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Treinos
                </span>
                <span className={`text-sm font-semibold ${getProgressTextColor(stats.treinos_percentage)}`}>
                  {stats.treinos_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(stats.treinos_percentage)}`}
                  style={{ width: `${Math.min(stats.treinos_percentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Protocolos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Protocolos
                </span>
                <span className={`text-sm font-semibold ${getProgressTextColor(stats.protocolos_percentage)}`}>
                  {stats.protocolos_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(stats.protocolos_percentage)}`}
                  style={{ width: `${Math.min(stats.protocolos_percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sequência e Meta */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.current_streak}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  dias seguidos
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Target size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.best_streak}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  melhor série
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
