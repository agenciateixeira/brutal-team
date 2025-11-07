'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  icon?: LucideIcon;
  color?: 'primary' | 'green' | 'blue' | 'yellow' | 'purple' | 'red';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    fill: 'bg-gradient-to-r from-primary-500 to-primary-600',
    text: 'text-primary-600 dark:text-primary-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    fill: 'bg-gradient-to-r from-green-500 to-emerald-600',
    text: 'text-green-600 dark:text-green-400'
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    fill: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    text: 'text-blue-600 dark:text-blue-400'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    fill: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    fill: 'bg-gradient-to-r from-purple-500 to-pink-600',
    text: 'text-purple-600 dark:text-purple-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    fill: 'bg-gradient-to-r from-red-500 to-rose-600',
    text: 'text-red-600 dark:text-red-400'
  }
};

const sizeClasses = {
  sm: { height: 'h-2', fontSize: 'text-xs' },
  md: { height: 'h-3', fontSize: 'text-sm' },
  lg: { height: 'h-4', fontSize: 'text-base' }
};

export default function ProgressBar({
  label,
  current,
  total,
  icon: Icon,
  color = 'primary',
  showPercentage = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  return (
    <div className="space-y-2">
      {/* Label e Porcentagem */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={colors.text} />}
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${sizes.fontSize}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className={`font-bold ${colors.text} ${sizes.fontSize}`}>
              {Math.round(percentage)}%
            </span>
          )}
          <span className={`text-gray-500 dark:text-gray-400 ${sizes.fontSize}`}>
            {current}/{total}
          </span>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className={`w-full ${colors.bg} rounded-full overflow-hidden ${sizes.height}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: 'easeOut',
            delay: 0.1
          }}
          className={`h-full ${colors.fill} rounded-full shadow-lg relative overflow-hidden`}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
