'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, Flame, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface AlunoStatisticsProps {
  alunoId: string;
  compact?: boolean;
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

export default function AlunoStatistics({ alunoId, compact = false }: AlunoStatisticsProps) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStatistics();

    // Subscribe to realtime changes in tracking tables
    const mealChannel = supabase
      .channel(`meal-tracking-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        () => {
          loadStatistics();
        }
      )
      .subscribe();

    const workoutChannel = supabase
      .channel(`workout-tracking-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        () => {
          loadStatistics();
        }
      )
      .subscribe();

    const protocolChannel = supabase
      .channel(`protocol-tracking-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'protocol_tracking',
          filter: `aluno_id=eq.${alunoId}`,
        },
        () => {
          loadStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mealChannel);
      supabase.removeChannel(workoutChannel);
      supabase.removeChannel(protocolChannel);
    };
  }, [alunoId]);

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_aluno_statistics', { aluno_user_id: alunoId });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats(data[0]);
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
        return <TrendingUp size={16} className="text-green-600" />;
      case 'declining':
        return <TrendingDown size={16} className="text-red-600" />;
      default:
        return <Minus size={16} className="text-gray-600" />;
    }
  };

  const getTrendText = () => {
    if (!stats) return '';

    switch (stats.trend) {
      case 'improving':
        return '⬆️ Melhorando';
      case 'declining':
        return '⬇️ Caindo';
      default:
        return '➡️ Estável';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle size={16} className="text-green-600" />;
    if (percentage >= 60) return <AlertTriangle size={16} className="text-yellow-600" />;
    return <AlertTriangle size={16} className="text-red-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Sem dados suficientes
        </p>
      </div>
    );
  }

  // Calcula adesão geral (média)
  const adesao_geral = Math.round(
    (stats.refeicoes_percentage + stats.treinos_percentage + stats.protocolos_percentage) / 3
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {getStatusIcon(adesao_geral)}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {adesao_geral}%
          </span>
          <span className="text-xs text-gray-500">adesão geral</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          {getTrendIcon()}
          <span>{getTrendText()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📊 Estatísticas (30 dias)
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
          {getTrendIcon()}
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {getTrendText()}
          </span>
        </div>
      </div>

      {/* Barras de Progresso */}
      <div className="space-y-4">
        {/* Refeições */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Refeições
            </span>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.refeicoes_percentage)}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.refeicoes_percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(stats.refeicoes_percentage)}`}
              style={{ width: `${Math.min(stats.refeicoes_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Treinos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Treinos
            </span>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.treinos_percentage)}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.treinos_percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(stats.treinos_percentage)}`}
              style={{ width: `${Math.min(stats.treinos_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Protocolos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Protocolos
            </span>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.protocolos_percentage)}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {stats.protocolos_percentage}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${getProgressColor(stats.protocolos_percentage)}`}
              style={{ width: `${Math.min(stats.protocolos_percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Sequências */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Flame size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.current_streak}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Sequência atual
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Target size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.best_streak}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Melhor série
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(stats.current_streak === 0 || adesao_geral < 60) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-900 dark:text-red-300">
                ⚠️ Atenção necessária
              </p>
              <p className="text-red-700 dark:text-red-400 mt-1">
                {stats.current_streak === 0 && 'Aluno sem atividade recente. '}
                {adesao_geral < 60 && 'Adesão abaixo de 60%.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
