'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, TrendingDown, Flame, User } from 'lucide-react';
import Link from 'next/link';

interface AlertsListProps {
  alunosIds: string[];
  alunosData: any[];
}

interface AlunoAlert {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  adesao: number;
  currentStreak: number;
  trend: 'improving' | 'declining' | 'stable';
  reasons: string[];
}

export default function AlertsList({ alunosIds, alunosData }: AlertsListProps) {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlunoAlert[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadAlerts();
  }, [alunosIds]);

  const loadAlerts = async () => {
    if (alunosIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const alertsPromises = alunosIds.map(async (alunoId) => {
        const { data, error } = await supabase
          .rpc('get_aluno_statistics', { aluno_user_id: alunoId });

        if (error || !data || data.length === 0) return null;

        const stats = data[0];
        const adesaoGeral = Math.round(
          (stats.refeicoes_percentage + stats.treinos_percentage + stats.protocolos_percentage) / 3
        );

        const reasons: string[] = [];

        // Verificar motivos de alerta
        if (adesaoGeral < 60) {
          reasons.push(`${adesaoGeral}% de adesão`);
        }
        if (stats.current_streak === 0) {
          reasons.push('Sem atividade recente');
        }
        if (stats.trend === 'declining') {
          reasons.push('Tendência de queda');
        }

        // Só retornar se tiver algum motivo de alerta
        if (reasons.length === 0) return null;

        const alunoData = alunosData.find(a => a.id === alunoId);

        return {
          id: alunoId,
          name: alunoData?.full_name || alunoData?.email || 'Aluno',
          email: alunoData?.email || '',
          avatar_url: alunoData?.avatar_url,
          adesao: adesaoGeral,
          currentStreak: stats.current_streak,
          trend: stats.trend,
          reasons
        };
      });

      const results = await Promise.all(alertsPromises);
      const validAlerts = results.filter((a): a is NonNullable<typeof a> => a !== null) as AlunoAlert[];

      // Ordenar por gravidade (menor adesão primeiro)
      validAlerts.sort((a, b) => a.adesao - b.adesao);

      setAlerts(validAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
              Todos os Alunos Estão Bem! 🎉
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Nenhum aluno precisa de atenção especial no momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-200 dark:border-orange-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b-2 border-orange-200 dark:border-orange-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300">
              ⚠️ Alunos que Precisam de Atenção
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              {alerts.length} {alerts.length === 1 ? 'aluno precisa' : 'alunos precisam'} de acompanhamento
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={`/coach/aluno/${alert.id}`}
            className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {alert.avatar_url ? (
                <img
                  src={alert.avatar_url}
                  alt={alert.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                  {alert.name[0]?.toUpperCase() || 'A'}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {alert.name}
                  </h4>
                  {alert.trend === 'declining' && (
                    <TrendingDown size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {alert.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              {/* Adesão */}
              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${
                  alert.adesao >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {alert.adesao}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  adesão
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
