import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DietaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dieta, setDieta] = useState<any>(null);

  useEffect(() => {
    loadDieta();
  }, []);

  async function loadDieta() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data } = await supabase
        .from('dietas')
        .select('*')
        .eq('aluno_id', user.id)
        .eq('active', true)
        .single();

      setDieta(data);

      // Marcar como visualizado
      if (data && data.viewed_by_aluno === false) {
        await supabase
          .from('dietas')
          .update({ viewed_by_aluno: true })
          .eq('id', data.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dieta:', error);
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDieta();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!dieta) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="nutrition-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>Nenhuma dieta disponível</Text>
        <Text style={styles.emptyText}>
          Seu coach ainda não criou uma dieta para você.
        </Text>
      </View>
    );
  }

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
      <View style={styles.header}>
        <Text style={styles.title}>Dieta Atual</Text>
        <Text style={styles.date}>
          Atualizada em {new Date(dieta.updated_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{dieta.nome || 'Sua Dieta'}</Text>
        <Text style={styles.cardContent}>{dieta.conteudo}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
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
  date: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[700],
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardContent: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});
