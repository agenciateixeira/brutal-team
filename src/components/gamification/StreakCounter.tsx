'use client';

import { motion } from 'framer-motion';
import { Flame, Award, TrendingUp } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'p-4',
    icon: 24,
    number: 'text-3xl',
    label: 'text-xs'
  },
  md: {
    container: 'p-6',
    icon: 32,
    number: 'text-4xl',
    label: 'text-sm'
  },
  lg: {
    container: 'p-8',
    icon: 40,
    number: 'text-5xl',
    label: 'text-base'
  }
};

export default function StreakCounter({
  currentStreak,
  longestStreak,
  size = 'md'
}: StreakCounterProps) {
  const sizes = sizeClasses[size];
  const isOnFire = currentStreak >= 7;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-2xl ${sizes.container}`}>
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-6">
        {/* Current Streak */}
        <div className="flex-1 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
            className="inline-flex items-center justify-center mb-2"
          >
            <Flame
              size={sizes.icon}
              className={`text-white ${isOnFire ? 'animate-pulse' : ''}`}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${sizes.number} font-black text-white mb-1 drop-shadow-lg`}
          >
            {currentStreak}
          </motion.div>

          <div className={`${sizes.label} font-semibold text-white/90 uppercase tracking-wider`}>
            Dias Seguidos
          </div>

          {isOnFire && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-xs font-bold text-yellow-200 flex items-center justify-center gap-1"
            >
              <Flame size={14} className="animate-bounce" />
              EM CHAMAS!
            </motion.div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-20 bg-white/30" />

        {/* Record Streak */}
        <div className="flex-1 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="inline-flex items-center justify-center mb-2"
          >
            <Award size={sizes.icon} className="text-yellow-200" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${sizes.number} font-black text-white mb-1 drop-shadow-lg`}
          >
            {longestStreak}
          </motion.div>

          <div className={`${sizes.label} font-semibold text-white/90 uppercase tracking-wider`}>
            Recorde
          </div>

          {currentStreak === longestStreak && currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-xs font-bold text-yellow-200 flex items-center justify-center gap-1"
            >
              <TrendingUp size={14} />
              NOVO RECORDE!
            </motion.div>
          )}
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur-lg opacity-50 -z-10" />
    </div>
  );
}
