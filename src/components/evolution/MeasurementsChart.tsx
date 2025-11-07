'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Ruler, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MeasurementData {
  measured_at: string;
  waist?: number;
  chest?: number;
  hips?: number;
  left_arm?: number;
  right_arm?: number;
  left_thigh?: number;
  right_thigh?: number;
}

interface MeasurementsChartProps {
  alunoId: string;
}

const measurementOptions = [
  { key: 'waist', label: 'Cintura', color: '#f59e0b' },
  { key: 'chest', label: 'Peito', color: '#3b82f6' },
  { key: 'hips', label: 'Quadril', color: '#8b5cf6' },
  { key: 'left_arm', label: 'Braço Esq.', color: '#10b981' },
  { key: 'right_arm', label: 'Braço Dir.', color: '#06b6d4' },
  { key: 'left_thigh', label: 'Coxa Esq.', color: '#ec4899' },
  { key: 'right_thigh', label: 'Coxa Dir.', color: '#f43f5e' },
];

export default function MeasurementsChart({ alunoId }: MeasurementsChartProps) {
  const [data, setData] = useState<MeasurementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>(['waist', 'chest']);
  const supabase = createClient();

  useEffect(() => {
    loadMeasurementsData();

    // Real-time subscription
    const channel = supabase
      .channel(`measurements-chart-${alunoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'body_measurements',
        filter: `aluno_id=eq.${alunoId}`,
      }, (payload) => {
        console.log('Measurements data changed:', payload);
        // Reload data after a short delay to ensure DB is updated
        setTimeout(loadMeasurementsData, 300);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId]);

  const loadMeasurementsData = async () => {
    try {
      const { data: measurements, error } = await supabase
        .from('body_measurements')
        .select('measured_at, waist, chest, hips, left_arm, right_arm, left_thigh, right_thigh')
        .eq('aluno_id', alunoId)
        .order('measured_at', { ascending: true });

      if (error) throw error;

      // Filtrar apenas medições que têm pelo menos uma medida
      const validMeasurements = measurements?.filter(m =>
        m.waist || m.chest || m.hips || m.left_arm || m.right_arm || m.left_thigh || m.right_thigh
      ) || [];

      setData(validMeasurements);
    } catch (error) {
      console.error('Erro ao carregar dados de medidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeasurement = (key: string) => {
    setSelectedMeasurements(prev =>
      prev.includes(key)
        ? prev.filter(m => m !== key)
        : [...prev, key]
    );
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
        <Ruler size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhuma medida corporal registrada
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Comece a registrar suas medidas para acompanhar sua evolução
        </p>
      </motion.div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    date: format(new Date(item.measured_at), 'dd/MM', { locale: ptBR }),
    fullDate: format(new Date(item.measured_at), 'dd MMM yyyy', { locale: ptBR }),
    waist: item.waist,
    chest: item.chest,
    hips: item.hips,
    left_arm: item.left_arm,
    right_arm: item.right_arm,
    left_thigh: item.left_thigh,
    right_thigh: item.right_thigh,
  }));

  // Calcular tendências
  const calculateTrend = (key: string) => {
    const values = chartData.map(d => d[key as keyof typeof d]).filter(v => typeof v === 'number') as number[];
    if (values.length < 2) return null;

    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;

    return {
      diff: Math.abs(diff),
      trend: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable'
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Ruler size={24} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Evolução das Medidas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.length} medições registradas
          </p>
        </div>
      </div>

      {/* Seleção de Medidas */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Selecione as medidas para visualizar:
        </p>
        <div className="flex flex-wrap gap-2">
          {measurementOptions.map(option => {
            const isSelected = selectedMeasurements.includes(option.key);
            const trend = calculateTrend(option.key);

            return (
              <motion.button
                key={option.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMeasurement(option.key)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${isSelected
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                style={isSelected ? { backgroundColor: option.color } : {}}
              >
                <div className="flex items-center gap-2">
                  <span>{option.label}</span>
                  {trend && trend.trend !== 'stable' && (
                    <>
                      {trend.trend === 'up' && <TrendingUp size={12} />}
                      {trend.trend === 'down' && <TrendingDown size={12} />}
                    </>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {selectedMeasurements.length > 0 ? (
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
                formatter={(value: number, name: string) => {
                  const option = measurementOptions.find(o => o.key === name);
                  return [`${value?.toFixed(1)} cm`, option?.label || name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value) => {
                  const option = measurementOptions.find(o => o.key === value);
                  return option?.label || value;
                }}
              />
              {selectedMeasurements.map(key => {
                const option = measurementOptions.find(o => o.key === key);
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={option?.color}
                    strokeWidth={2}
                    dot={{ fill: option?.color, r: 3 }}
                    activeDot={{ r: 5 }}
                    name={key}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">Selecione pelo menos uma medida para visualizar o gráfico</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        {selectedMeasurements.slice(0, 4).map(key => {
          const option = measurementOptions.find(o => o.key === key);
          const values = chartData.map(d => d[key as keyof typeof d]).filter(v => typeof v === 'number') as number[];

          if (values.length === 0) return null;

          const first = values[0];
          const last = values[values.length - 1];
          const diff = last - first;

          return (
            <div key={key} className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {option?.label}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {last.toFixed(1)}
              </p>
              <p className={`text-xs font-semibold mt-1 ${
                diff > 0.5 ? 'text-orange-600' : diff < -0.5 ? 'text-green-600' : 'text-gray-500'
              }`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)} cm
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
