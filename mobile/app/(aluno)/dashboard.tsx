import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import GamificationDashboard from '../../components/gamification/GamificationDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [dietaAtiva, setDietaAtiva] = useState<any>(null);
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [updatesCount, setUpdatesCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'aluno') {
        return;
      }

      setProfile(profileData);

      // ===== GAMIFICAÇÃO: Buscar dados =====

      // Buscar stats do aluno
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('aluno_id', user.id)
        .single();

      setUserStats(stats);

      // Buscar todos os achievements disponíveis
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true });

      setAchievements(allAchievements || []);

      // Buscar achievements desbloqueados pelo aluno
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select(
          `
          *,
          achievements (*)
        `
        )
        .eq('aluno_id', user.id);

      // Extrair apenas os achievements
      const userAchievs =
        userAchievementsData?.map((ua) => ua.achievements).filter(Boolean) || [];
      setUserAchievements(userAchievs);

      // Buscar stats do dia atual
      const today = new Date().toISOString().split('T')[0];
      const { data: todayStatsData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('aluno_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setTodayStats(todayStatsData);

      // Criar stats default se não existir
      if (!stats) {
        await supabase.from('user_stats').insert({ aluno_id: user.id });
      }

      // ===== FIM GAMIFICAÇÃO =====

      // Buscar dieta ativa
      const { data: dieta } = await supabase
        .from('dietas')
        .select('*')
        .eq('aluno_id', user.id)
        .eq('active', true)
        .single();

      setDietaAtiva(dieta);

      // Buscar treino ativo
      const { data: treino } = await supabase
        .from('treinos')
        .select('*')
        .eq('aluno_id', user.id)
        .eq('active', true)
        .single();

      setTreinoAtivo(treino);

      // Contar atualizações
      const updates = [
        dieta && dieta.viewed_by_aluno === false,
        treino && treino.viewed_by_aluno === false,
      ].filter(Boolean).length;

      setUpdatesCount(updates);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasDietaUpdate = dietaAtiva && dietaAtiva.viewed_by_aluno === false;
  const hasTreinoUpdate = treinoAtivo && treinoAtivo.viewed_by_aluno === false;
  const showWelcomeMessage = !dietaAtiva || !treinoAtivo;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Bem-vindo de volta, {profile?.full_name || 'Atleta'}!
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* Gamification Dashboard */}
      {userStats && achievements.length > 0 && (
        <GamificationDashboard
          userStats={userStats}
          achievements={achievements}
          userAchievements={userAchievements}
          todayStats={todayStats}
          userName={profile?.full_name}
        />
      )}

      {/* Notificação de Atualizações */}
      {updatesCount > 0 && (
        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <View style={styles.updateIconContainer}>
              <Ionicons name="notifications" size={24} color="#fff" />
            </View>
            <View style={styles.updateContent}>
              <View style={styles.updateTitleRow}>
                <Ionicons name="sparkles" size={20} color="#f97316" />
                <Text style={styles.updateTitle}>Nova Atualização Disponível!</Text>
              </View>
              <Text style={styles.updateText}>
                {updatesCount === 2
                  ? `${
                      profile?.full_name || 'Atleta'
                    }, seu coach fez atualização nos seus treinos e dieta. Acesse-os para verificar já e manter a sua evolução em dia!`
                  : hasDietaUpdate
                  ? `${
                      profile?.full_name || 'Atleta'
                    }, sua dieta foi atualizada, acesse a página da dieta e verifique.`
                  : `${
                      profile?.full_name || 'Atleta'
                    }, seu treino foi atualizado, acesse a página do treino e verifique.`}
              </Text>
              <View style={styles.updateButtons}>
                {hasDietaUpdate && (
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => router.push('/(aluno)/dieta' as any)}
                  >
                    <Ionicons name="nutrition" size={16} color="#fff" />
                    <Text style={styles.updateButtonText}>Ver Dieta</Text>
                  </TouchableOpacity>
                )}
                {hasTreinoUpdate && (
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => router.push('/(aluno)/treino' as any)}
                  >
                    <Ionicons name="barbell" size={16} color="#fff" />
                    <Text style={styles.updateButtonText}>Ver Treino</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Cards de Acesso Rápido */}
      <View style={styles.quickAccessGrid}>
        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/(aluno)/treino' as any)}
        >
          <Ionicons name="barbell" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Treino</Text>
          <Text style={styles.quickAccessSubtitle}>
            {treinoAtivo ? 'Ativo' : 'Não definido'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/(aluno)/dieta' as any)}
        >
          <Ionicons name="nutrition" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Dieta</Text>
          <Text style={styles.quickAccessSubtitle}>
            {dietaAtiva ? 'Ativa' : 'Não definida'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/(aluno)/progresso' as any)}
        >
          <Ionicons name="trending-up" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Progresso</Text>
          <Text style={styles.quickAccessSubtitle}>Ver evolução</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/(aluno)/comunidade' as any)}
        >
          <Ionicons name="people" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Comunidade</Text>
          <Text style={styles.quickAccessSubtitle}>Interagir</Text>
        </TouchableOpacity>
      </View>

      {/* Mensagem de Boas-vindas se não tiver treino ou dieta */}
      {showWelcomeMessage && (
        <View style={styles.welcomeCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
          <Text style={styles.welcomeTitle}>Bem-vindo ao Brutal Team!</Text>
          <Text style={styles.welcomeText}>
            {!dietaAtiva && !treinoAtivo
              ? 'Seu coach em breve irá criar sua dieta e treino personalizados.'
              : !dietaAtiva
              ? 'Seu coach em breve irá criar sua dieta personalizada.'
              : 'Seu coach em breve irá criar seu treino personalizado.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
  updateCard: {
    backgroundColor: '#fed7aa',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: '#f97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  updateIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#f97316',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateContent: {
    flex: 1,
  },
  updateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  updateTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#7c2d12',
  },
  updateText: {
    fontSize: fontSize.md,
    color: '#7c2d12',
    marginBottom: spacing.md,
    lineHeight: fontSize.md * 1.5,
  },
  updateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f97316',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAccessTitle: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  quickAccessSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  welcomeTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  welcomeText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
