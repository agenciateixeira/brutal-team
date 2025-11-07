'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

interface MotivationalMessageProps {
  weekProgress: number; // Porcentagem da semana
  currentStreak: number;
  userName?: string;
}

type MessageType = 'excellent' | 'good' | 'warning' | 'motivational';

interface Message {
  type: MessageType;
  icon: React.ElementType;
  text: string;
}

const messageStyles = {
  excellent: {
    bg: 'from-green-500/20 via-emerald-500/20 to-green-600/20',
    border: 'border-green-400/50',
    icon: CheckCircle,
    glow: 'shadow-green-500/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  good: {
    bg: 'from-blue-500/20 via-cyan-500/20 to-blue-600/20',
    border: 'border-blue-400/50',
    icon: TrendingUp,
    glow: 'shadow-blue-500/30',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    bg: 'from-yellow-500/20 via-orange-500/20 to-yellow-600/20',
    border: 'border-yellow-400/50',
    icon: AlertCircle,
    glow: 'shadow-yellow-500/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  motivational: {
    bg: 'from-purple-500/20 via-pink-500/20 to-purple-600/20',
    border: 'border-purple-400/50',
    icon: Sparkles,
    glow: 'shadow-purple-500/30',
    iconColor: 'text-purple-600 dark:text-purple-400'
  }
};

export default function MotivationalMessage({
  weekProgress,
  currentStreak,
  userName
}: MotivationalMessageProps) {
  const message = useMemo<Message>(() => {
    const name = userName || 'Guerreiro(a)';
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const hour = new Date().getHours();

    // Mensagens baseadas no progresso da semana
    if (weekProgress >= 90) {
      return {
        type: 'excellent',
        icon: CheckCircle,
        text: `🔥 ${name}, você está BRUTAL! ${Math.round(weekProgress)}% das metas batidas esta semana!`
      };
    } else if (weekProgress >= 70) {
      return {
        type: 'good',
        icon: TrendingUp,
        text: `💪 Ótimo ritmo, ${name}! ${Math.round(weekProgress)}% concluído. Continue assim!`
      };
    } else if (weekProgress >= 50) {
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `🎯 ${name}, você está no caminho! Falta pouco para bater a meta da semana!`
      };
    } else if (weekProgress >= 30) {
      return {
        type: 'warning',
        icon: AlertCircle,
        text: `⚡ ${name}, hora de acelerar! A semana está passando, bora recuperar!`
      };
    }

    // Mensagens baseadas no streak
    if (currentStreak >= 30) {
      return {
        type: 'excellent',
        icon: CheckCircle,
        text: `👑 LENDÁRIO! ${currentStreak} dias de consistência absoluta, ${name}!`
      };
    } else if (currentStreak >= 14) {
      return {
        type: 'excellent',
        icon: CheckCircle,
        text: `🏆 ${currentStreak} dias seguidos! Você é imparável, ${name}!`
      };
    } else if (currentStreak >= 7) {
      return {
        type: 'good',
        icon: TrendingUp,
        text: `🔥 Semana completa! ${currentStreak} dias de foco total!`
      };
    }

    // Mensagens baseadas no dia da semana
    if (today === 1) { // Segunda
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `💫 Bom dia, ${name}! Nova semana, novas conquistas. Vamos com tudo!`
      };
    } else if (today === 5) { // Sexta
      return {
        type: 'good',
        icon: TrendingUp,
        text: `🎉 Sextou, ${name}! Mas o foco continua firme!`
      };
    } else if (today === 0) { // Domingo
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `🔄 Domingo de foco! Planeje a semana e mantenha o ritmo, ${name}!`
      };
    }

    // Mensagens baseadas na hora do dia
    if (hour >= 5 && hour < 12) {
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `☀️ Bom dia, ${name}! Comece o dia com energia e determinação!`
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `💪 Boa tarde, ${name}! Mantenha o foco até o final do dia!`
      };
    } else {
      return {
        type: 'motivational',
        icon: Sparkles,
        text: `🌙 Boa noite, ${name}! Descanse bem para conquistar amanhã!`
      };
    }
  }, [weekProgress, currentStreak, userName]);

  const style = messageStyles[message.type];
  const Icon = message.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        relative overflow-hidden
        backdrop-blur-xl
        bg-gradient-to-br ${style.bg}
        border-2 ${style.border}
        shadow-2xl ${style.glow}
        rounded-2xl p-6
        before:absolute before:inset-0 before:bg-white/10 before:backdrop-blur-3xl before:-z-10
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Glassmorphism layers */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-80`} />

      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      {/* Glass shine effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon with glass effect */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20
          }}
          className="relative"
        >
          <div className={`absolute inset-0 ${style.iconColor} opacity-20 blur-xl`} />
          <div className="relative p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Icon size={28} className={`${style.iconColor} drop-shadow-lg`} />
          </div>
        </motion.div>

        {/* Message text */}
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 text-base md:text-lg font-bold text-gray-900 dark:text-white drop-shadow-lg"
        >
          {message.text}
        </motion.p>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 5
        }}
      />

      {/* Bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </motion.div>
  );
}
