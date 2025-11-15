import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: 'primary' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  label,
  current,
  total,
  icon,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  const colorMap = {
    primary: '#0081A7',
    green: '#10b981',
    purple: '#8b5cf6',
  };

  const bgColorMap = {
    primary: '#e0f2f7',
    green: '#d1fae5',
    purple: '#ede9fe',
  };

  const barColor = colorMap[color];
  const bgColor = bgColorMap[color];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Ionicons name={icon} size={18} color={barColor} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.stats, { color: barColor }]}>
          {current}/{total}
        </Text>
      </View>
      <View style={[styles.progressBackground, { backgroundColor: bgColor }]}>
        <View
          style={[
            styles.progressBar,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stats: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  progressBackground: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  percentage: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
});
