'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function YearCountdown() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      const diff = endOfYear.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      // Calcular progresso do ano (% que já passou)
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const totalDays = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = totalDays - days;
      const progressPercent = (daysPassed / totalDays) * 100;

      setDaysLeft(days);
      setProgress(progressPercent);
    };

    calculateDaysLeft();
    // Atualizar a cada hora
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  const getMotivationMessage = () => {
    if (daysLeft > 300) return "O ano está só começando! 🚀";
    if (daysLeft > 200) return "Ainda dá tempo de conquistar tudo! 💪";
    if (daysLeft > 100) return "Metade do caminho andado! 🔥";
    if (daysLeft > 50) return "A reta final chegou! ⚡";
    if (daysLeft > 30) return "Último mês do ano! 🏆";
    return "Dias finais! Vai com tudo! 🎯";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden backdrop-blur-2xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6 shadow-2xl border-2 border-white/60 dark:border-gray-700/60"
    >
      {/* Liquid Glass Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/70 dark:border-gray-700/70">
            <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <h3 className="text-gray-900 dark:text-white font-bold text-lg">Dias Restantes de {new Date().getFullYear()}</h3>
        </div>

        {/* Contador Principal */}
        <div className="text-center mb-4">
          <motion.div
            key={daysLeft}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl md:text-7xl font-black bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xl"
          >
            {daysLeft}
          </motion.div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold mt-2">dias para acabar o ano</p>
        </div>

        {/* Barra de Progresso do Ano */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 font-medium">
            <span>Progresso do ano</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/70 dark:border-gray-600/70">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full shadow-lg relative"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            </motion.div>
          </div>
        </div>

        {/* Mensagem Motivacional */}
        <div className="flex items-center justify-center gap-2 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border border-white/70 dark:border-gray-700/70 rounded-xl p-3">
          <Clock className="text-yellow-600 dark:text-yellow-400" size={18} />
          <p className="text-gray-900 dark:text-white font-semibold text-sm">
            {getMotivationMessage()}
          </p>
        </div>

        {/* Info adicional */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-white/70 dark:border-gray-700/70">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Dia do Ano</p>
            <p className="text-gray-900 dark:text-white text-xl font-bold">
              {Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24))}
            </p>
          </div>
          <div className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-white/70 dark:border-gray-700/70">
            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Semana</p>
            <p className="text-gray-900 dark:text-white text-xl font-bold">
              {Math.ceil(((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) / 7)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
