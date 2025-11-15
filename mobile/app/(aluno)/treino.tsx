import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Exercicio {
  nome: string;
  series?: string | number;
  repeticoes?: string;
  carga?: string;
  obs?: string;
  tempo?: string;
  descanso?: string;
}

interface TreinoDia {
  dia?: string;
  titulo?: string;
  exercicios?: Exercicio[];
}

export default function TreinoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [treino, setTreino] = useState<any>(null);
  const [parsedTreino, setParsedTreino] = useState<TreinoDia[]>([]);

  useEffect(() => {
    loadTreino();
  }, []);

  function parseTreinoData(training_plan: any): TreinoDia[] {
    try {
      // Se já for um objeto
      const plan = typeof training_plan === 'string' ? JSON.parse(training_plan) : training_plan;

      // Se for array direto
      if (Array.isArray(plan)) {
        return plan;
      }

      // Se tiver uma chave com array (ex: treinos, dias, workouts)
      const possibleKeys = ['treinos', 'dias', 'workouts', 'training', 'dias_treino'];
      for (const key of possibleKeys) {
        if (plan[key] && Array.isArray(plan[key])) {
          return plan[key];
        }
      }

      // Se for um objeto com keys numéricas ou de dias da semana
      const keys = Object.keys(plan);
      if (keys.length > 0) {
        return keys.map((key) => ({
          dia: key,
          titulo: plan[key].titulo || plan[key].nome || key,
          exercicios: plan[key].exercicios || [],
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao parsear treino:', error);
      return [];
    }
  }

  async function loadTreino() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data } = await supabase
        .from('treinos')
        .select('*')
        .eq('aluno_id', user.id)
        .eq('active', true)
        .single();

      setTreino(data);

      // Parsear o training_plan
      if (data?.training_plan) {
        const parsed = parseTreinoData(data.training_plan);
        setParsedTreino(parsed);
      }

      // Marcar como visualizado
      if (data && data.viewed_by_aluno === false) {
        await supabase
          .from('treinos')
          .update({ viewed_by_aluno: true })
          .eq('id', data.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar treino:', error);
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTreino();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!treino) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Ionicons name="barbell-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>Nenhum treino ativo</Text>
        <Text style={styles.emptyText}>
          Seu coach ainda não criou um treino para você. Aguarde!
        </Text>
      </ScrollView>
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
        <View style={styles.headerIcon}>
          <Ionicons name="barbell" size={32} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Seu Treino</Text>
        <Text style={styles.subtitle}>
          Atualizado em {new Date(treino.updated_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Nome do Treino */}
      {treino.nome && (
        <View style={styles.nameCard}>
          <Text style={styles.nameTitle}>{treino.nome}</Text>
        </View>
      )}

      {/* Treinos por Dia */}
      {parsedTreino.length > 0 ? (
        parsedTreino.map((dia, diaIndex) => (
          <View key={diaIndex} style={styles.diaCard}>
            <View style={styles.diaHeader}>
              <View style={styles.diaIconContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.diaTitle}>
                {dia.dia || dia.titulo || `Treino ${diaIndex + 1}`}
              </Text>
            </View>

            {dia.exercicios && dia.exercicios.length > 0 ? (
              dia.exercicios.map((exercicio, exIndex) => (
                <View key={exIndex} style={styles.exercicioCard}>
                  <View style={styles.exercicioHeader}>
                    <View style={styles.exercicioNumber}>
                      <Text style={styles.exercicioNumberText}>{exIndex + 1}</Text>
                    </View>
                    <Text style={styles.exercicioNome}>{exercicio.nome}</Text>
                  </View>

                  <View style={styles.exercicioDetails}>
                    {exercicio.series && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="repeat"
                          size={16}
                          color={colors.text.tertiary}
                        />
                        <Text style={styles.detailText}>
                          {exercicio.series} séries
                        </Text>
                      </View>
                    )}

                    {exercicio.repeticoes && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="fitness"
                          size={16}
                          color={colors.text.tertiary}
                        />
                        <Text style={styles.detailText}>
                          {exercicio.repeticoes} reps
                        </Text>
                      </View>
                    )}

                    {exercicio.carga && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="barbell"
                          size={16}
                          color={colors.text.tertiary}
                        />
                        <Text style={styles.detailText}>{exercicio.carga}</Text>
                      </View>
                    )}

                    {exercicio.tempo && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="time"
                          size={16}
                          color={colors.text.tertiary}
                        />
                        <Text style={styles.detailText}>{exercicio.tempo}</Text>
                      </View>
                    )}

                    {exercicio.descanso && (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="hourglass"
                          size={16}
                          color={colors.text.tertiary}
                        />
                        <Text style={styles.detailText}>
                          Descanso: {exercicio.descanso}
                        </Text>
                      </View>
                    )}
                  </View>

                  {exercicio.obs && (
                    <View style={styles.obsContainer}>
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color={colors.primary[500]}
                      />
                      <Text style={styles.obsText}>{exercicio.obs}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noExerciciosText}>
                Nenhum exercício cadastrado para este dia
              </Text>
            )}
          </View>
        ))
      ) : (
        <View style={styles.fallbackCard}>
          <Text style={styles.fallbackTitle}>Informações do Treino</Text>
          {treino.conteudo && (
            <Text style={styles.fallbackContent}>{treino.conteudo}</Text>
          )}
          {treino.training_plan && typeof treino.training_plan === 'string' && (
            <Text style={styles.fallbackContent}>{treino.training_plan}</Text>
          )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  nameCard: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nameTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  diaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[500],
  },
  diaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  diaTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  exercicioCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exercicioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exercicioNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  exercicioNumberText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: '#fff',
  },
  exercicioNome: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  exercicioDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  obsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  obsText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  noExerciciosText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fallbackCard: {
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
  fallbackTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  fallbackContent: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: fontSize.md * 1.5,
  },
});
