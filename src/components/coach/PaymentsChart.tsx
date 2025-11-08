'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentsChartProps {
  paymentHistory: any[];
  students: any[];
}

type PeriodFilter = 'today' | '7days' | 'month' | 'custom';

export default function PaymentsChart({ paymentHistory, students }: PaymentsChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calcular datas baseado no período
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();

    switch (period) {
      case 'today':
        return { startDate: today, endDate: today };
      case '7days':
        return { startDate: subDays(today, 6), endDate: today };
      case 'month':
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case 'custom':
        return {
          startDate: customStartDate ? new Date(customStartDate) : startOfMonth(today),
          endDate: customEndDate ? new Date(customEndDate) : endOfMonth(today)
        };
      default:
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    }
  }, [period, customStartDate, customEndDate]);

  // Filtrar pagamentos pelo período
  const filteredPayments = useMemo(() => {
    return paymentHistory.filter(payment => {
      const paymentDate = new Date(payment.payment_date || payment.created_at);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
  }, [paymentHistory, startDate, endDate]);

  // Calcular métricas
  const metrics = useMemo(() => {
    // Faturamento total do período
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // MRR (Monthly Recurring Revenue) - soma dos valores mensais dos planos ativos
    const mrr = students
      .filter(s => s.is_active)
      .reduce((sum, s) => sum + (s.monthly_value || 0), 0);

    // Churn - alunos inativos no período / total de alunos
    const inactiveStudents = students.filter(s => !s.is_active);
    const churnRate = students.length > 0 ? (inactiveStudents.length / students.length) * 100 : 0;

    // Total de alunos ativos
    const activeStudents = students.filter(s => s.is_active).length;

    return {
      totalRevenue,
      mrr,
      churnRate,
      activeStudents,
      totalStudents: students.length
    };
  }, [filteredPayments, students]);

  // Dados para o gráfico de linhas (tipo mercado financeiro)
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
      const dayPayments = filteredPayments.filter(p =>
        isSameDay(new Date(p.payment_date || p.created_at), day)
      );

      const revenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        date: day,
        revenue,
        accumulated: 0 // Será calculado depois
      };
    });
  }, [filteredPayments, startDate, endDate]);

  // Calcular valores acumulados
  const chartDataWithAccumulated = useMemo(() => {
    let accumulated = 0;
    return chartData.map(point => {
      accumulated += point.revenue;
      return { ...point, accumulated };
    });
  }, [chartData]);

  // Valores para escala do gráfico
  const maxRevenue = useMemo(() => {
    return Math.max(...chartDataWithAccumulated.map(d => d.accumulated), 1);
  }, [chartDataWithAccumulated]);

  // Gerar pontos do SVG
  const svgPoints = useMemo(() => {
    if (chartDataWithAccumulated.length === 0) return '';

    const width = 100; // Porcentagem
    const height = 100; // Porcentagem
    const pointWidth = width / (chartDataWithAccumulated.length - 1 || 1);

    return chartDataWithAccumulated
      .map((point, i) => {
        const x = i * pointWidth;
        const y = height - ((point.accumulated / maxRevenue) * height);
        return `${x},${y}`;
      })
      .join(' ');
  }, [chartDataWithAccumulated, maxRevenue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Calendar size={18} className="text-primary-600" />
            Período:
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriod('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'today'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === '7days'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                period === 'custom'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Personalizado
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Date pickers para período personalizado */}
        {period === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Faturamento</p>
          <p className="text-2xl font-bold break-words">{formatCurrency(metrics.totalRevenue)}</p>
        </div>

        {/* MRR */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} />
            <Users size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">MRR (Mensal)</p>
          <p className="text-2xl font-bold break-words">{formatCurrency(metrics.mrr)}</p>
        </div>

        {/* Churn Rate */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown size={24} />
            <Users size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Taxa de Churn</p>
          <p className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</p>
        </div>

        {/* Alunos Ativos */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <TrendingUp size={20} className="opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Alunos Ativos</p>
          <p className="text-2xl font-bold">{metrics.activeStudents}/{metrics.totalStudents}</p>
        </div>
      </div>

      {/* Gráfico de Linhas (Tipo Mercado Financeiro) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Evolução do Faturamento
        </h3>

        {chartDataWithAccumulated.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Nenhum dado encontrado para o período selecionado
          </div>
        ) : (
          <div className="relative">
            {/* SVG Chart */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-64 sm:h-80"
            >
              {/* Grid de fundo */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-gray-200 dark:text-gray-700" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Área preenchida */}
              <polygon
                points={`0,100 ${svgPoints} 100,100`}
                fill="url(#gradient)"
                opacity="0.2"
              />

              {/* Gradiente */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Linha principal */}
              <polyline
                points={svgPoints}
                fill="none"
                stroke="#10b981"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Pontos */}
              {chartDataWithAccumulated.map((point, i) => {
                const width = 100;
                const height = 100;
                const pointWidth = width / (chartDataWithAccumulated.length - 1 || 1);
                const x = i * pointWidth;
                const y = height - ((point.accumulated / maxRevenue) * height);

                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="0.8"
                    fill="#10b981"
                    className="hover:r-1.5 transition-all cursor-pointer"
                  >
                    <title>
                      {format(point.date, 'dd/MM/yyyy', { locale: ptBR })}
                      {'\n'}
                      Dia: {formatCurrency(point.revenue)}
                      {'\n'}
                      Acumulado: {formatCurrency(point.accumulated)}
                    </title>
                  </circle>
                );
              })}
            </svg>

            {/* Legenda de datas */}
            <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400 px-2">
              <span>{format(startDate, 'dd/MM/yy', { locale: ptBR })}</span>
              <span>{format(endDate, 'dd/MM/yy', { locale: ptBR })}</span>
            </div>

            {/* Indicador de valor máximo */}
            <div className="absolute top-0 right-0 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg text-sm font-semibold">
              Máx: {formatCurrency(maxRevenue)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
