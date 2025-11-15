import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

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
    bg: ['#fdba74', '#d97706'], // from-orange-300 to-amber-600
    border: '#f97316', // border-orange-500
    text: '#c2410c', // text-orange-700
  },
  silver: {
    bg: ['#d1d5db', '#64748b'], // from-gray-300 to-slate-500
    border: '#9ca3af', // border-gray-400
    text: '#374151', // text-gray-700
  },
  gold: {
    bg: ['#fde047', '#ca8a04'], // from-yellow-300 to-yellow-600
    border: '#eab308', // border-yellow-500
    text: '#a16207', // text-yellow-700
  },
  platinum: {
    bg: ['#67e8f9', '#2563eb'], // from-cyan-300 to-blue-600
    border: '#06b6d4', // border-cyan-500
    text: '#0e7490', // text-cyan-700
  },
};

const sizeConfig = {
  sm: { container: 64, icon: 24, fontSize: fontSize.xs },
  md: { container: 80, icon: 32, fontSize: fontSize.sm },
  lg: { container: 96, icon: 40, fontSize: fontSize.md },
};

export default function AchievementBadge({
  achievement,
  unlocked,
  size = 'md',
  showName = true,
}: AchievementBadgeProps) {
  const tierColor = tierColors[achievement.tier];
  const sizeStyle = sizeConfig[size];

  return (
    <View style={styles.wrapper}>
      {/* Badge */}
      <View
        style={[
          styles.badge,
          {
            width: sizeStyle.container,
            height: sizeStyle.container,
            backgroundColor: unlocked ? tierColor.bg[0] : colors.surfaceGray,
            borderColor: unlocked ? tierColor.border : colors.border,
          },
        ]}
      >
        {unlocked ? (
          <Text style={{ fontSize: sizeStyle.icon }}>{achievement.icon}</Text>
        ) : (
          <Ionicons name="lock-closed" size={sizeStyle.icon * 0.6} color={colors.text.tertiary} />
        )}
      </View>

      {/* Name */}
      {showName && (
        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.name,
              {
                fontSize: sizeStyle.fontSize,
                color: unlocked ? tierColor.text : colors.text.tertiary,
              },
            ]}
            numberOfLines={2}
          >
            {achievement.name}
          </Text>
          {unlocked && achievement.tier === 'platinum' && (
            <Text style={styles.rareLabel}>Raro!</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 100,
  },
  badge: {
    borderRadius: 9999, // Círculo completo
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  rareLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0e7490', // cyan-700
    textTransform: 'uppercase',
    marginTop: spacing.xs / 2,
  },
});
