'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ProgressCircleProps {
  percentage: number;
  label: string;
  icon?: LucideIcon;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'green' | 'blue' | 'yellow' | 'purple' | 'red';
  showValue?: boolean;
}

const colorClasses = {
  primary: {
    stroke: '#f97316', // primary-500
    glow: 'drop-shadow-lg drop-shadow-primary-500/50',
    text: 'text-primary-600 dark:text-primary-400'
  },
  green: {
    stroke: '#10b981', // green-500
    glow: 'drop-shadow-lg drop-shadow-green-500/50',
    text: 'text-green-600 dark:text-green-400'
  },
  blue: {
    stroke: '#3b82f6', // blue-500
    glow: 'drop-shadow-lg drop-shadow-blue-500/50',
    text: 'text-blue-600 dark:text-blue-400'
  },
  yellow: {
    stroke: '#eab308', // yellow-500
    glow: 'drop-shadow-lg drop-shadow-yellow-500/50',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  purple: {
    stroke: '#a855f7', // purple-500
    glow: 'drop-shadow-lg drop-shadow-purple-500/50',
    text: 'text-purple-600 dark:text-purple-400'
  },
  red: {
    stroke: '#ef4444', // red-500
    glow: 'drop-shadow-lg drop-shadow-red-500/50',
    text: 'text-red-600 dark:text-red-400'
  }
};

export default function ProgressCircle({
  percentage,
  label,
  icon: Icon,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showValue = true
}: ProgressCircleProps) {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colors = colorClasses[color];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circle SVG */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            className={colors.glow}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
              delay: 0.2
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon size={size * 0.25} className={colors.text} />}
          {showValue && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`text-2xl font-black ${colors.text}`}
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {label}
      </span>
    </div>
  );
}
