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
    bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    border: 'border-green-400',
    icon: CheckCircle,
    glow: 'shadow-green-500/50'
  },
  good: {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    border: 'border-blue-400',
    icon: TrendingUp,
    glow: 'shadow-blue-500/50'
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    border: 'border-yellow-400',
    icon: AlertCircle,
    glow: 'shadow-yellow-500/50'
  },
  motivational: {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
    border: 'border-purple-400',
    icon: Sparkles,
    glow: 'shadow-purple-500/50'
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
        ${style.bg}
        border-2 ${style.border}
        shadow-xl ${style.glow}
        rounded-2xl p-6
      `}
    >
      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20
          }}
        >
          <Icon size={32} className="text-white drop-shadow-lg" />
        </motion.div>

        {/* Message text */}
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 text-base md:text-lg font-semibold text-white drop-shadow-lg"
        >
          {message.text}
        </motion.p>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
    </motion.div>
  );
}
