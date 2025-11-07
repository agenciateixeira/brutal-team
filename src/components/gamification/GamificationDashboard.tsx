'use client';

import { Calendar, Dumbbell, Utensils, Camera, Trophy } from 'lucide-react';
import ProgressBar from './ProgressBar';
import ProgressCircle from './ProgressCircle';
import StreakCounter from './StreakCounter';
import AchievementBadge from './AchievementBadge';
import MotivationalMessage from './MotivationalMessage';
import { motion } from 'framer-motion';

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
  userName
}: GamificationDashboardProps) {
  // Calcular progresso da semana
  const weekProgress = Math.round(
    ((userStats.current_month_workout_percentage + userStats.current_month_meal_percentage) / 2)
  );

  // Progresso do dia atual
  const todayWorkoutProgress = todayStats
    ? (todayStats.workouts_completed / Math.max(todayStats.workouts_planned, 1)) * 100
    : 0;

  const todayMealProgress = todayStats
    ? (todayStats.meals_completed / Math.max(todayStats.meals_planned, 1)) * 100
    : 0;

  // Mesclar achievements com status de desbloqueado
  const achievementsWithStatus = achievements.map(achievement => ({
    ...achievement,
    unlocked_at: userAchievements.find(ua => ua.code === achievement.code)?.unlocked_at || null
  }));

  // Separar conquistas desbloqueadas e bloqueadas
  const unlockedAchievements = achievementsWithStatus.filter(a => a.unlocked_at);
  const lockedAchievements = achievementsWithStatus.filter(a => !a.unlocked_at);

  return (
    <div className="space-y-6">
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
        size="lg"
      />

      {/* Progress do Dia */}
      {todayStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Progresso de Hoje
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Circles */}
            <ProgressCircle
              percentage={todayWorkoutProgress}
              label="Treinos"
              icon={Dumbbell}
              color="primary"
              size={140}
            />
            <ProgressCircle
              percentage={todayMealProgress}
              label="Refeições"
              icon={Utensils}
              color="green"
              size={140}
            />
          </div>
        </motion.div>
      )}

      {/* Progress do Mês */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Progresso do Mês
          </h3>
        </div>

        <div className="space-y-5">
          <ProgressBar
            label="Treinos Concluídos"
            current={userStats.total_workouts}
            total={30} // Meta de 30 treinos por mês
            icon={Dumbbell}
            color="primary"
            size="lg"
          />

          <ProgressBar
            label="Refeições Completas"
            current={userStats.total_meals_completed}
            total={150} // Meta de ~5 refeições/dia x 30 dias
            icon={Utensils}
            color="green"
            size="lg"
          />

          <ProgressBar
            label="Fotos de Evolução"
            current={userStats.total_photos}
            total={4} // Meta de 4 fotos por mês (1 por semana)
            icon={Camera}
            color="purple"
            size="lg"
          />
        </div>
      </motion.div>

      {/* Conquistas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Conquistas
            </h3>
          </div>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>

        {/* Conquistas Desbloqueadas */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">
              🏆 Desbloqueadas
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {unlockedAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={true}
                  size="md"
                  showName={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conquistas Bloqueadas */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              🔒 Bloqueadas
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {lockedAchievements.slice(0, 6).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={false}
                  size="md"
                  showName={true}
                />
              ))}
            </div>
            {lockedAchievements.length > 6 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                +{lockedAchievements.length - 6} mais para desbloquear
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Estatísticas Gerais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-orange-600 dark:text-orange-400">
            {userStats.total_active_days}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
            Dias Ativos
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {userStats.total_workouts}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
            Treinos
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-green-600 dark:text-green-400">
            {userStats.total_meals_completed}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
            Refeições
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {userStats.total_photos}
          </p>
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">
            Fotos
          </p>
        </div>
      </motion.div>
    </div>
  );
}
