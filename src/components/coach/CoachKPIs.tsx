'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Users, AlertTriangle, Loader2 } from 'lucide-react';

interface CoachKPIsProps {
  alunosIds: string[];
}

interface AlunoStats {
  alunoId: string;
  adesaoGeral: number;
  currentStreak: number;
  trend: 'improving' | 'declining' | 'stable';
}

export default function CoachKPIs({ alunosIds }: CoachKPIsProps) {
  const [loading, setLoading] = useState(true);
  const [adesaoMedia, setAdesaoMedia] = useState(0);
  const [alunosAtivos, setAlunosAtivos] = useState(0);
  const [alunosAtencao, setAlunosAtencao] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadKPIs();
  }, [alunosIds]);

  const loadKPIs = async () => {
    if (alunosIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const statsPromises = alunosIds.map(async (alunoId) => {
        const { data, error } = await supabase
          .rpc('get_aluno_statistics', { aluno_user_id: alunoId });

        if (error || !data || data.length === 0) return null;

        const stats = data[0];
        const adesaoGeral = Math.round(
          (stats.refeicoes_percentage + stats.treinos_percentage + stats.protocolos_percentage) / 3
        );

        return {
          alunoId,
          adesaoGeral,
          currentStreak: stats.current_streak,
          trend: stats.trend
        };
      });

      const results = await Promise.all(statsPromises);
      const validStats = results.filter((s): s is AlunoStats => s !== null);

      if (validStats.length > 0) {
        // Calcular adesão média
        const media = Math.round(
          validStats.reduce((sum, s) => sum + s.adesaoGeral, 0) / validStats.length
        );
        setAdesaoMedia(media);

        // Contar alunos ativos (com sequência > 0)
        const ativos = validStats.filter(s => s.currentStreak > 0).length;
        setAlunosAtivos(ativos);

        // Contar alunos que precisam de atenção (adesão < 60% ou sequência = 0)
        const atencao = validStats.filter(s => s.adesaoGeral < 60 || s.currentStreak === 0).length;
        setAlunosAtencao(atencao);
      }
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getAdesaoColor = (adesao: number) => {
    if (adesao >= 80) return 'text-green-600 dark:text-green-400';
    if (adesao >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAdesaoBg = (adesao: number) => {
    if (adesao >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (adesao >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Adesão Média Geral */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Adesão Média Geral
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${getAdesaoColor(adesaoMedia)}`}>
                {adesaoMedia}%
              </p>
              {adesaoMedia >= 80 && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Excelente
                </span>
              )}
              {adesaoMedia >= 60 && adesaoMedia < 80 && (
                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                  Bom
                </span>
              )}
              {adesaoMedia < 60 && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Precisa atenção
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Média de todos os alunos (30 dias)
            </p>
          </div>
          <div className={`w-16 h-16 ${getAdesaoBg(adesaoMedia)} rounded-full flex items-center justify-center`}>
            <TrendingUp className={getAdesaoColor(adesaoMedia)} size={28} />
          </div>
        </div>
      </div>

      {/* Alunos Ativos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Alunos Ativos
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {alunosAtivos}
              </p>
              <span className="text-xl text-gray-500">/ {alunosIds.length}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Com sequência de dias ativa
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Users className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
        </div>
      </div>

      {/* Alunos Precisam Atenção */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Precisam Atenção
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${alunosAtencao > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {alunosAtencao}
              </p>
              {alunosAtencao === 0 && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Todos bem!
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Adesão &lt; 60% ou sem sequência
            </p>
          </div>
          <div className={`w-16 h-16 ${alunosAtencao > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-full flex items-center justify-center`}>
            <AlertTriangle className={alunosAtencao > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
