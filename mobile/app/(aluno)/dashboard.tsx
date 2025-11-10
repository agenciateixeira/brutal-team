import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [dietaAtiva, setDietaAtiva] = useState<any>(null);
  const [treinoAtivo, setTreinoAtivo] = useState<any>(null);
  const [updatesCount, setUpdatesCount] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        // Redirecionar para coach se necessário
        return;
      }

      setProfile(profileData);

      // Buscar stats de gamificação
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('aluno_id', user.id)
        .single();

      setUserStats(stats);

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
        treino && treino.viewed_by_aluno === false
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
    year: 'numeric'
  });

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

      {/* Gamificação - Stats Card */}
      {userStats && (
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="trophy" size={24} color={colors.primary[500]} />
            <Text style={styles.statsTitle}>Seu Progresso</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.current_level || 1}</Text>
              <Text style={styles.statLabel}>Nível</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.total_points || 0}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Sequência</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notificação de Atualizações */}
      {updatesCount > 0 && (
        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <Ionicons name="notifications" size={24} color="#f97316" />
            <Text style={styles.updateTitle}>Nova Atualização!</Text>
          </View>
          <Text style={styles.updateText}>
            Seu coach fez atualizações. Confira agora!
          </Text>
          <View style={styles.updateButtons}>
            {dietaAtiva && dietaAtiva.viewed_by_aluno === false && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => router.push('/aluno/dieta' as any)}
              >
                <Ionicons name="nutrition" size={16} color="#fff" />
                <Text style={styles.updateButtonText}>Ver Dieta</Text>
              </TouchableOpacity>
            )}
            {treinoAtivo && treinoAtivo.viewed_by_aluno === false && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => router.push('/aluno/treino' as any)}
              >
                <Ionicons name="barbell" size={16} color="#fff" />
                <Text style={styles.updateButtonText}>Ver Treino</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Cards de Acesso Rápido */}
      <View style={styles.quickAccessGrid}>
        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/aluno/treino' as any)}
        >
          <Ionicons name="barbell" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Treino</Text>
          <Text style={styles.quickAccessSubtitle}>
            {treinoAtivo ? 'Ativo' : 'Não definido'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/aluno/dieta' as any)}
        >
          <Ionicons name="nutrition" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Dieta</Text>
          <Text style={styles.quickAccessSubtitle}>
            {dietaAtiva ? 'Ativa' : 'Não definida'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/aluno/progresso' as any)}
        >
          <Ionicons name="trending-up" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Progresso</Text>
          <Text style={styles.quickAccessSubtitle}>Ver evolução</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => router.push('/aluno/comunidade' as any)}
        >
          <Ionicons name="people" size={32} color={colors.primary[500]} />
          <Text style={styles.quickAccessTitle}>Comunidade</Text>
          <Text style={styles.quickAccessSubtitle}>Interagir</Text>
        </TouchableOpacity>
      </View>

      {/* Mensagem de Boas-vindas se não tiver treino ou dieta */}
      {(!dietaAtiva || !treinoAtivo) && (
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
    backgroundColor: colors.backgroundGray, // bg-gray-50 igual ao web
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
  statsCard: {
    backgroundColor: colors.surface, // branco
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border, // cinza claro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primaryColor, // azul
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  updateCard: {
    backgroundColor: '#fed7aa',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  updateTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: '#7c2d12',
    marginLeft: spacing.sm,
  },
  updateText: {
    fontSize: fontSize.md,
    color: '#7c2d12',
    marginBottom: spacing.md,
  },
  updateButtons: {
    flexDirection: 'row',
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
    marginBottom: spacing.lg,
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
