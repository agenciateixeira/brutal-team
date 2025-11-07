'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import GamificationDashboard from './GamificationDashboard';

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

interface GamificationDashboardWrapperProps {
  alunoId: string;
  userName?: string;
  initialUserStats: UserStats | null;
  initialAchievements: Achievement[];
  initialUserAchievements: Achievement[];
  initialTodayStats: DailyStats | null;
}

export default function GamificationDashboardWrapper({
  alunoId,
  userName,
  initialUserStats,
  initialAchievements,
  initialUserAchievements,
  initialTodayStats
}: GamificationDashboardWrapperProps) {
  const [userStats, setUserStats] = useState<UserStats | null>(initialUserStats);
  const [achievements] = useState<Achievement[]>(initialAchievements);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(initialUserAchievements);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(initialTodayStats);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Função para recarregar dados
  const reloadStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 [Gamification] Recarregando estatísticas...');

      // Buscar user_stats
      const { data: userStatsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('aluno_id', alunoId)
        .single();

      if (userStatsData) {
        console.log('✅ [Gamification] user_stats atualizado:', userStatsData);
        setUserStats(userStatsData);
      }

      // Buscar daily_stats de hoje
      const today = new Date().toISOString().split('T')[0];
      const { data: todayStatsData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('date', today)
        .maybeSingle();

      console.log('✅ [Gamification] daily_stats de hoje:', todayStatsData);
      setTodayStats(todayStatsData);

      // Buscar achievements desbloqueados
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('aluno_id', alunoId);

      const newUserAchievements = userAchievementsData?.map(ua => ua.achievements).filter(Boolean) || [];
      console.log('✅ [Gamification] achievements atualizados:', newUserAchievements.length);
      setUserAchievements(newUserAchievements);

    } catch (error) {
      console.error('❌ [Gamification] Erro ao recarregar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎮 [Gamification] Iniciando subscriptions...');

    // Subscribe to user_stats changes
    const userStatsChannel = supabase
      .channel(`gamification-user-stats-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('🎯 [Gamification] user_stats mudou:', payload);
          setTimeout(reloadStats, 300);
        }
      )
      .subscribe((status) => {
        console.log('📡 [Gamification] user_stats subscription:', status);
      });

    // Subscribe to daily_stats changes
    const dailyStatsChannel = supabase
      .channel(`gamification-daily-stats-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_stats',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('📊 [Gamification] daily_stats mudou:', payload);
          setTimeout(reloadStats, 300);
        }
      )
      .subscribe((status) => {
        console.log('📡 [Gamification] daily_stats subscription:', status);
      });

    // Subscribe to user_achievements changes
    const achievementsChannel = supabase
      .channel(`gamification-achievements-${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('🏆 [Gamification] achievement desbloqueado:', payload);
          setTimeout(reloadStats, 300);
        }
      )
      .subscribe((status) => {
        console.log('📡 [Gamification] achievements subscription:', status);
      });

    // Cleanup
    return () => {
      console.log('🔌 [Gamification] Limpando subscriptions...');
      supabase.removeChannel(userStatsChannel);
      supabase.removeChannel(dailyStatsChannel);
      supabase.removeChannel(achievementsChannel);
    };
  }, [alunoId]);

  if (!userStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-2 right-2 z-50">
          <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            Atualizando...
          </div>
        </div>
      )}

      <GamificationDashboard
        userStats={userStats}
        achievements={achievements}
        userAchievements={userAchievements as any}
        todayStats={todayStats}
        userName={userName}
      />
    </div>
  );
}
