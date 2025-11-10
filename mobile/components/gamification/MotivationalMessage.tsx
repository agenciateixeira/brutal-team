import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface MotivationalMessageProps {
  weekProgress: number; // Porcentagem da semana
  currentStreak: number;
  userName?: string;
}

type MessageType = 'excellent' | 'good' | 'warning' | 'motivational';

interface Message {
  type: MessageType;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const messageStyles = {
  excellent: {
    bg: '#d1fae5', // green-100
    border: '#6ee7b7', // green-300
    iconColor: '#059669', // green-600
  },
  good: {
    bg: '#dbeafe', // blue-100
    border: '#93c5fd', // blue-300
    iconColor: '#2563eb', // blue-600
  },
  warning: {
    bg: '#fef3c7', // yellow-100
    border: '#fcd34d', // yellow-300
    iconColor: '#d97706', // yellow-600
  },
  motivational: {
    bg: '#f3e8ff', // purple-100
    border: '#d8b4fe', // purple-300
    iconColor: '#9333ea', // purple-600
  },
};

export default function MotivationalMessage({
  weekProgress,
  currentStreak,
  userName,
}: MotivationalMessageProps) {
  const message = useMemo<Message>(() => {
    const name = userName || 'Guerreiro(a)';
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const hour = new Date().getHours();

    // Mensagens baseadas no progresso da semana
    if (weekProgress >= 90) {
      return {
        type: 'excellent',
        icon: 'checkmark-circle',
        text: `🔥 ${name}, você está BRUTAL! ${Math.round(weekProgress)}% das metas batidas esta semana!`,
      };
    } else if (weekProgress >= 70) {
      return {
        type: 'good',
        icon: 'trending-up',
        text: `💪 Ótimo ritmo, ${name}! ${Math.round(weekProgress)}% concluído. Continue assim!`,
      };
    } else if (weekProgress >= 50) {
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `🎯 ${name}, você está no caminho! Falta pouco para bater a meta da semana!`,
      };
    } else if (weekProgress >= 30) {
      return {
        type: 'warning',
        icon: 'alert-circle',
        text: `⚡ ${name}, hora de acelerar! A semana está passando, bora recuperar!`,
      };
    }

    // Mensagens baseadas no streak
    if (currentStreak >= 30) {
      return {
        type: 'excellent',
        icon: 'checkmark-circle',
        text: `👑 LENDÁRIO! ${currentStreak} dias de consistência absoluta, ${name}!`,
      };
    } else if (currentStreak >= 14) {
      return {
        type: 'excellent',
        icon: 'checkmark-circle',
        text: `🏆 ${currentStreak} dias seguidos! Você é imparável, ${name}!`,
      };
    } else if (currentStreak >= 7) {
      return {
        type: 'good',
        icon: 'trending-up',
        text: `🔥 Semana completa! ${currentStreak} dias de foco total!`,
      };
    }

    // Mensagens baseadas no dia da semana
    if (today === 1) {
      // Segunda
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `💫 Bom dia, ${name}! Nova semana, novas conquistas. Vamos com tudo!`,
      };
    } else if (today === 5) {
      // Sexta
      return {
        type: 'good',
        icon: 'trending-up',
        text: `🎉 Sextou, ${name}! Mas o foco continua firme!`,
      };
    } else if (today === 0) {
      // Domingo
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `🔄 Domingo de foco! Planeje a semana e mantenha o ritmo, ${name}!`,
      };
    }

    // Mensagens baseadas na hora do dia
    if (hour >= 5 && hour < 12) {
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `☀️ Bom dia, ${name}! Comece o dia com energia e determinação!`,
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `💪 Boa tarde, ${name}! Mantenha o foco até o final do dia!`,
      };
    } else {
      return {
        type: 'motivational',
        icon: 'sparkles',
        text: `🌙 Boa noite, ${name}! Descanse bem para conquistar amanhã!`,
      };
    }
  }, [weekProgress, currentStreak, userName]);

  const style = messageStyles[message.type];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: style.bg,
          borderColor: style.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${style.iconColor}20`, // 20% opacity
          },
        ]}
      >
        <Ionicons name={message.icon} size={28} color={style.iconColor} />
      </View>

      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: fontSize.md * 1.5,
  },
});
