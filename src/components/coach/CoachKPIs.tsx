'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, FileCheck, UserPlus } from 'lucide-react';

interface CoachKPIsProps {
  alunosIds: string[];
}

export default function CoachKPIs({ alunosIds }: CoachKPIsProps) {
  const [loading, setLoading] = useState(true);
  const [alunosAtivos, setAlunosAtivos] = useState(0);
  const [pendenciasCount, setPendenciasCount] = useState(0);
  const [alunosNovosCount, setAlunosNovosCount] = useState(0);
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
      // 1. Contar alunos ativos (total de alunos aprovados)
      setAlunosAtivos(alunosIds.length);

      // 2. Buscar pendências (resumos semanais não visualizados)
      const { data: pendencias, error: pendenciasError } = await supabase
        .from('weekly_updates')
        .select('id')
        .eq('viewed_by_coach', false);

      if (pendenciasError) {
        console.error('Erro ao buscar pendências:', pendenciasError);
      } else {
        setPendenciasCount(pendencias?.length || 0);
      }

      // 3. Buscar alunos novos do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayISO = firstDayOfMonth.toISOString();

      const { data: alunosNovos, error: novosError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'aluno')
        .eq('approved', true)
        .gte('created_at', firstDayISO);

      if (novosError) {
        console.error('Erro ao buscar alunos novos:', novosError);
      } else {
        setAlunosNovosCount(alunosNovos?.length || 0);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total de Alunos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total de Alunos
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {alunosAtivos}
              </p>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                ativos
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Alunos aprovados no sistema
            </p>
          </div>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Users className="text-blue-600 dark:text-blue-400" size={28} />
          </div>
        </div>
      </div>

      {/* Pendências (Resumos Semanais) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Pendências
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${pendenciasCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {pendenciasCount}
              </p>
              {pendenciasCount === 0 && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Tudo em dia!
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Resumos semanais para visualizar
            </p>
          </div>
          <div className={`w-16 h-16 ${pendenciasCount > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-full flex items-center justify-center`}>
            <FileCheck className={pendenciasCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} size={28} />
          </div>
        </div>
      </div>

      {/* Alunos Novos do Mês */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Alunos Novos
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold ${alunosNovosCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                {alunosNovosCount}
              </p>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                este mês
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Novos alunos em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </div>
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <UserPlus className="text-purple-600 dark:text-purple-400" size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
