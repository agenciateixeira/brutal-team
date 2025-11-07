'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked_at?: string | null;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const tierColors = {
  bronze: {
    bg: 'from-orange-300 to-amber-600',
    border: 'border-orange-500',
    glow: 'shadow-orange-500/50',
    text: 'text-orange-700 dark:text-orange-400'
  },
  silver: {
    bg: 'from-gray-300 to-slate-500',
    border: 'border-gray-400',
    glow: 'shadow-gray-500/50',
    text: 'text-gray-700 dark:text-gray-400'
  },
  gold: {
    bg: 'from-yellow-300 to-yellow-600',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/50',
    text: 'text-yellow-700 dark:text-yellow-400'
  },
  platinum: {
    bg: 'from-cyan-300 to-blue-600',
    border: 'border-cyan-500',
    glow: 'shadow-cyan-500/50',
    text: 'text-cyan-700 dark:text-cyan-400'
  }
};

const sizeClasses = {
  sm: { container: 'w-16 h-16', icon: 'text-2xl', name: 'text-xs' },
  md: { container: 'w-20 h-20', icon: 'text-3xl', name: 'text-sm' },
  lg: { container: 'w-24 h-24', icon: 'text-4xl', name: 'text-base' }
};

export default function AchievementBadge({
  achievement,
  unlocked,
  size = 'md',
  showName = true
}: AchievementBadgeProps) {
  const colors = tierColors[achievement.tier];
  const sizes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2 group">
      {/* Badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: unlocked ? 1.1 : 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
        className={`
          relative ${sizes.container} rounded-full flex items-center justify-center
          ${unlocked
            ? `bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-lg ${colors.glow}`
            : 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700'
          }
          transition-all duration-300
        `}
        title={`${achievement.name}\n${achievement.description}`}
      >
        {unlocked ? (
          <>
            {/* Icon */}
            <span className={sizes.icon}>{achievement.icon}</span>

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />

            {/* Glow ring */}
            {achievement.tier === 'gold' || achievement.tier === 'platinum' ? (
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${colors.bg} opacity-30 blur-md`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            {/* Locked icon */}
            <Lock size={size === 'sm' ? 20 : size === 'md' ? 24 : 28} className="text-gray-400 dark:text-gray-600" />
          </>
        )}
      </motion.div>

      {/* Name and Description */}
      {showName && (
        <div className="text-center max-w-[100px]">
          <p className={`${sizes.name} font-semibold ${unlocked ? colors.text : 'text-gray-500 dark:text-gray-500'} truncate`}>
            {achievement.name}
          </p>
          {unlocked && achievement.tier === 'platinum' && (
            <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
              Raro!
            </p>
          )}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute hidden group-hover:block z-50 bottom-full mb-2 p-3 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl max-w-xs pointer-events-none">
        <p className="font-semibold text-sm mb-1">{achievement.name}</p>
        <p className="text-xs text-gray-300">{achievement.description}</p>
        {unlocked && achievement.unlocked_at && (
          <p className="text-[10px] text-gray-400 mt-1">
            Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
          </p>
        )}
        {!unlocked && (
          <p className="text-[10px] text-yellow-400 mt-1">🔒 Bloqueado</p>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45" />
        </div>
      </div>
    </div>
  );
}
