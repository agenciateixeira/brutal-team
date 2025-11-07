'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeightData {
  measured_at: string;
  weight: number;
}

interface WeightChartProps {
  alunoId: string;
}

export default function WeightChart({ alunoId }: WeightChartProps) {
  const [data, setData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [weightDiff, setWeightDiff] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    loadWeightData();

    // Real-time subscription
    const channel = supabase
      .channel(`weight-chart-${alunoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'body_measurements',
        filter: `aluno_id=eq.${alunoId}`,
      }, (payload) => {
        console.log('Weight data changed:', payload);
        // Reload data after a short delay to ensure DB is updated
        setTimeout(loadWeightData, 300);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId]);

  const loadWeightData = async () => {
    try {
      const { data: measurements, error } = await supabase
        .from('body_measurements')
        .select('measured_at, weight')
        .eq('aluno_id', alunoId)
        .not('weight', 'is', null)
        .order('measured_at', { ascending: true });

      if (error) throw error;

      if (measurements && measurements.length > 0) {
        setData(measurements);

        // Calcular tendência
        const firstWeight = measurements[0].weight;
        const lastWeight = measurements[measurements.length - 1].weight;
        const diff = lastWeight - firstWeight;

        setWeightDiff(Math.abs(diff));

        if (diff > 0.5) {
          setTrend('up');
        } else if (diff < -0.5) {
          setTrend('down');
        } else {
          setTrend('stable');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados de peso:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />;
      case 'down':
        return <TrendingDown className="text-green-600 dark:text-green-400" size={20} />;
      default:
        return <Minus className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'up':
        return `+${weightDiff.toFixed(1)}kg desde o início`;
      case 'down':
        return `-${weightDiff.toFixed(1)}kg desde o início`;
      default:
        return 'Peso estável';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-orange-600 dark:text-orange-400';
      case 'down':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <Scale size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum dado de peso registrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Comece a registrar seu peso para acompanhar sua evolução
        </p>
      </motion.div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    date: format(new Date(item.measured_at), 'dd/MM', { locale: ptBR }),
    fullDate: format(new Date(item.measured_at), 'dd MMM yyyy', { locale: ptBR }),
    weight: item.weight
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Scale size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Evolução do Peso
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.length} medições registradas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-semibold ${getTrendColor()}`}>
            {getTrendText()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelFormatter={(value) => {
                const item = chartData.find(d => d.date === value);
                return item ? item.fullDate : value;
              }}
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Peso (kg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data[0].weight.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Peso Inicial
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {data[data.length - 1].weight.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Peso Atual
          </p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${getTrendColor()}`}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            {weightDiff.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Diferença (kg)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
