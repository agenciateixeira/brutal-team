'use client';

import { BarChart3 } from 'lucide-react';

interface PaymentsChartProps {
  plansByType: {
    mensal: number;
    semestral: number;
    anual: number;
  };
}

export default function PaymentsChart({ plansByType }: PaymentsChartProps) {
  const total = plansByType.mensal + plansByType.semestral + plansByType.anual;

  // Calcular porcentagens
  const mensalPercent = total > 0 ? (plansByType.mensal / total) * 100 : 0;
  const semestralPercent = total > 0 ? (plansByType.semestral / total) * 100 : 0;
  const anualPercent = total > 0 ? (plansByType.anual / total) * 100 : 0;

  // Encontrar o maior valor para escalar as barras
  const maxValue = Math.max(plansByType.mensal, plansByType.semestral, plansByType.anual, 1);

  const bars = [
    {
      label: 'Mensal',
      value: plansByType.mensal,
      percent: mensalPercent,
      height: (plansByType.mensal / maxValue) * 100,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Semestral',
      value: plansByType.semestral,
      percent: semestralPercent,
      height: (plansByType.semestral / maxValue) * 100,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Anual',
      value: plansByType.anual,
      percent: anualPercent,
      height: (plansByType.anual / maxValue) * 100,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <BarChart3 className="text-primary-600 dark:text-primary-400" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Distribuição de Planos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total de {total} {total === 1 ? 'aluno' : 'alunos'} ativo{total !== 1 && 's'}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum plano ativo encontrado
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gráfico de Barras */}
          <div className="flex items-end justify-around gap-6 h-64">
            {bars.map((bar, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-3">
                {/* Barra */}
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full ${bar.color} rounded-t-lg transition-all duration-500 flex items-end justify-center pb-3 relative group`}
                    style={{ height: `${bar.height}%`, minHeight: bar.value > 0 ? '40px' : '0px' }}
                  >
                    {bar.value > 0 && (
                      <>
                        <span className="text-white font-bold text-2xl">
                          {bar.value}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {bar.percent.toFixed(1)}% dos alunos
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className={`font-semibold ${bar.textColor}`}>
                    {bar.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {bar.percent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            {bars.map((bar, index) => (
              <div
                key={index}
                className={`${bar.lightColor} rounded-lg p-4 text-center`}
              >
                <p className={`text-3xl font-bold ${bar.textColor}`}>
                  {bar.value}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {bar.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {bar.percent.toFixed(1)}% do total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
