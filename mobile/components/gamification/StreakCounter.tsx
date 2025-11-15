import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  size = 'md',
}: StreakCounterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="flame" size={32} color="#f97316" />
      </View>

      <View style={styles.content}>
        <View style={styles.streakItem}>
          <Text style={styles.streakValue}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Dias seguidos</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.streakItem}>
          <Text style={[styles.streakValue, { color: colors.text.tertiary }]}>
            {longestStreak}
          </Text>
          <Text style={styles.streakLabel}>Melhor sequência</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: '#f97316',
  },
  streakLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});
