import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, fontSize } from '../../lib/theme';

interface ProgressCircleProps {
  percentage: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: 'primary' | 'green' | 'purple';
  size?: number;
}

export default function ProgressCircle({
  percentage,
  label,
  icon,
  color = 'primary',
  size = 140,
}: ProgressCircleProps) {
  const colorMap = {
    primary: '#0081A7',
    green: '#10b981',
    purple: '#8b5cf6',
  };

  const strokeColor = colorMap[color];
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={6}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={6}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.content}>
        <Ionicons name={icon} size={28} color={strokeColor} />
        <Text style={[styles.percentage, { color: strokeColor }]}>
          {Math.round(progress)}%
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    gap: spacing.xs,
  },
  percentage: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
