import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import ProgressBar from './ProgressBar';
import ProgressCircle from './ProgressCircle';
import StreakCounter from './StreakCounter';
import AchievementBadge from './AchievementBadge';
import MotivationalMessage from './MotivationalMessage';

interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_workouts: number;
  total_meals_completed: number;
  total_photos: number;
  total_active_days: number;
  current_month_workout_percentage: number;
  current_month_meal_percentage: number;
  current_week_photo_percentage: number;
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked_at?: string | null;
}

interface DailyStats {
  workouts_completed: number;
  workouts_planned: number;
  meals_completed: number;
  meals_planned: number;
  photos_uploaded: number;
}

interface GamificationDashboardProps {
  userStats: UserStats;
  achievements: Achievement[];
  userAchievements: Achievement[];
  todayStats: DailyStats | null;
  userName?: string;
}

export default function GamificationDashboard({
  userStats,
  achievements,
  userAchievements,
  todayStats,
  userName,
}: GamificationDashboardProps) {
  // Calcular progresso da semana
  const weekProgress = Math.round(
    (userStats.current_month_workout_percentage + userStats.current_month_meal_percentage) / 2
  );

  // Progresso do dia atual
  const todayWorkoutProgress = todayStats
    ? (todayStats.workouts_completed / Math.max(todayStats.workouts_planned, 1)) * 100
    : 0;

  const todayMealProgress = todayStats
    ? (todayStats.meals_completed / Math.max(todayStats.meals_planned, 1)) * 100
    : 0;

  // Mesclar achievements com status de desbloqueado
  const achievementsWithStatus = achievements.map((achievement) => ({
    ...achievement,
    unlocked_at:
      userAchievements.find((ua) => ua.code === achievement.code)?.unlocked_at || null,
  }));

  // Separar conquistas desbloqueadas e bloqueadas
  const unlockedAchievements = achievementsWithStatus.filter((a) => a.unlocked_at);
  const lockedAchievements = achievementsWithStatus.filter((a) => !a.unlocked_at);

  return (
    <View style={styles.container}>
      {/* Mensagem Motivacional */}
      <MotivationalMessage
        weekProgress={weekProgress}
        currentStreak={userStats.current_streak}
        userName={userName}
      />

      {/* Streak Counter */}
      <StreakCounter
        currentStreak={userStats.current_streak}
        longestStreak={userStats.longest_streak}
      />

      {/* Progresso de Hoje */}
      {todayStats && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary[500]} />
            <Text style={styles.cardTitle}>Progresso de Hoje</Text>
          </View>

          <View style={styles.progressCirclesRow}>
            <ProgressCircle
              percentage={todayWorkoutProgress}
              label="Treinos"
              icon="barbell"
              color="primary"
              size={140}
            />
            <ProgressCircle
              percentage={todayMealProgress}
              label="Refeições"
              icon="restaurant"
              color="green"
              size={140}
            />
          </View>
        </View>
      )}

      {/* Progresso do Mês */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy" size={20} color={colors.primary[500]} />
          <Text style={styles.cardTitle}>Progresso do Mês</Text>
        </View>

        <View style={styles.progressBarsContainer}>
          <ProgressBar
            label="Treinos Concluídos"
            current={userStats.total_workouts}
            total={30}
            icon="barbell"
            color="primary"
          />

          <ProgressBar
            label="Refeições Completas"
            current={userStats.total_meals_completed}
            total={150}
            icon="restaurant"
            color="green"
          />

          <ProgressBar
            label="Fotos de Evolução"
            current={userStats.total_photos}
            total={4}
            icon="camera"
            color="purple"
          />
        </View>
      </View>

      {/* Conquistas */}
      <View style={styles.card}>
        <View style={styles.achievementsHeader}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={20} color="#eab308" />
            <Text style={styles.cardTitle}>Conquistas</Text>
          </View>
          <Text style={styles.achievementsCount}>
            {unlockedAchievements.length}/{achievements.length}
          </Text>
        </View>

        {/* Conquistas Desbloqueadas */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.achievementsSectionTitle}>🏆 Desbloqueadas</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsGrid}
            >
              {unlockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={true}
                  size="md"
                  showName={true}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Conquistas Bloqueadas */}
        {lockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={[styles.achievementsSectionTitle, { color: colors.text.tertiary }]}>
              🔒 Bloqueadas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsGrid}
            >
              {lockedAchievements.slice(0, 6).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={false}
                  size="md"
                  showName={true}
                />
              ))}
            </ScrollView>
            {lockedAchievements.length > 6 && (
              <Text style={styles.moreAchievements}>
                +{lockedAchievements.length - 6} mais para desbloquear
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Estatísticas Gerais */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardOrange]}>
          <Text style={[styles.statValue, { color: '#ea580c' }]}>
            {userStats.total_active_days}
          </Text>
          <Text style={styles.statLabel}>Dias Ativos</Text>
        </View>

        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={[styles.statValue, { color: '#2563eb' }]}>
            {userStats.total_workouts}
          </Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {userStats.total_meals_completed}
          </Text>
          <Text style={styles.statLabel}>Refeições</Text>
        </View>

        <View style={[styles.statCard, styles.statCardPurple]}>
          <Text style={[styles.statValue, { color: '#9333ea' }]}>
            {userStats.total_photos}
          </Text>
          <Text style={styles.statLabel}>Fotos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  progressCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.lg,
  },
  progressBarsContainer: {
    gap: spacing.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  achievementsCount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  achievementsSection: {
    marginBottom: spacing.md,
  },
  achievementsSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: spacing.sm,
  },
  achievementsGrid: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  moreAchievements: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardOrange: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  statCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statCardPurple: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
