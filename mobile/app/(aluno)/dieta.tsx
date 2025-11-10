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

interface Alimento {
  nome: string;
  quantidade?: string;
  calorias?: string | number;
  proteinas?: string | number;
  carboidratos?: string | number;
  gorduras?: string | number;
}

interface Refeicao {
  nome?: string;
  titulo?: string;
  horario?: string;
  alimentos?: Alimento[];
  calorias?: string | number;
  proteinas?: string | number;
  carboidratos?: string | number;
  gorduras?: string | number;
  obs?: string;
}

export default function DietaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dieta, setDieta] = useState<any>(null);
  const [parsedDieta, setParsedDieta] = useState<Refeicao[]>([]);

  useEffect(() => {
    loadDieta();
  }, []);

  function parseDietaData(diet_plan: any): Refeicao[] {
    try {
      // Se já for um objeto
      const plan = typeof diet_plan === 'string' ? JSON.parse(diet_plan) : diet_plan;

      // Se for array direto
      if (Array.isArray(plan)) {
        return plan;
      }

      // Se tiver uma chave com array (ex: refeicoes, meals, diet)
      const possibleKeys = ['refeicoes', 'meals', 'diet', 'plano', 'refeicoes_diarias'];
      for (const key of possibleKeys) {
        if (plan[key] && Array.isArray(plan[key])) {
          return plan[key];
        }
      }

      // Se for um objeto com keys de refeições
      const keys = Object.keys(plan);
      if (keys.length > 0) {
        return keys.map((key) => ({
          nome: key,
          titulo: plan[key].titulo || plan[key].nome || key,
          horario: plan[key].horario,
          alimentos: plan[key].alimentos || [],
          calorias: plan[key].calorias,
          proteinas: plan[key].proteinas,
          carboidratos: plan[key].carboidratos,
          gorduras: plan[key].gorduras,
          obs: plan[key].obs,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao parsear dieta:', error);
      return [];
    }
  }

  async function loadDieta() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      // Parsear o diet_plan
      if (data?.diet_plan) {
        const parsed = parseDietaData(data.diet_plan);
        setParsedDieta(parsed);
      }

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
        <Ionicons name="nutrition-outline" size={64} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>Nenhuma dieta ativa</Text>
        <Text style={styles.emptyText}>
          Seu coach ainda não criou uma dieta para você. Aguarde!
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
          <Ionicons name="nutrition" size={32} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Sua Dieta</Text>
        <Text style={styles.subtitle}>
          Atualizada em {new Date(dieta.updated_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      {/* Nome da Dieta */}
      {dieta.nome && (
        <View style={styles.nameCard}>
          <Text style={styles.nameTitle}>{dieta.nome}</Text>
        </View>
      )}

      {/* Refeições */}
      {parsedDieta.length > 0 ? (
        parsedDieta.map((refeicao, refIndex) => (
          <View key={refIndex} style={styles.refeicaoCard}>
            <View style={styles.refeicaoHeader}>
              <View style={styles.refeicaoIconContainer}>
                <Ionicons
                  name={getRefeicaoIcon(refeicao.nome || refeicao.titulo || '')}
                  size={24}
                  color="#fff"
                />
              </View>
              <View style={styles.refeicaoInfo}>
                <Text style={styles.refeicaoTitle}>
                  {refeicao.titulo || refeicao.nome || `Refeição ${refIndex + 1}`}
                </Text>
                {refeicao.horario && (
                  <View style={styles.horarioContainer}>
                    <Ionicons name="time" size={14} color={colors.text.tertiary} />
                    <Text style={styles.horarioText}>{refeicao.horario}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Macros Totais da Refeição */}
            {(refeicao.calorias || refeicao.proteinas || refeicao.carboidratos || refeicao.gorduras) && (
              <View style={styles.macrosContainer}>
                {refeicao.calorias && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{refeicao.calorias}</Text>
                    <Text style={styles.macroLabel}>kcal</Text>
                  </View>
                )}
                {refeicao.proteinas && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{refeicao.proteinas}g</Text>
                    <Text style={styles.macroLabel}>Proteínas</Text>
                  </View>
                )}
                {refeicao.carboidratos && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{refeicao.carboidratos}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                )}
                {refeicao.gorduras && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{refeicao.gorduras}g</Text>
                    <Text style={styles.macroLabel}>Gorduras</Text>
                  </View>
                )}
              </View>
            )}

            {/* Alimentos */}
            {refeicao.alimentos && refeicao.alimentos.length > 0 ? (
              <View style={styles.alimentosContainer}>
                {refeicao.alimentos.map((alimento, aIndex) => (
                  <View key={aIndex} style={styles.alimentoItem}>
                    <View style={styles.alimentoHeader}>
                      <View style={styles.alimentoBullet} />
                      <Text style={styles.alimentoNome}>{alimento.nome}</Text>
                    </View>

                    {alimento.quantidade && (
                      <Text style={styles.alimentoQuantidade}>
                        {alimento.quantidade}
                      </Text>
                    )}

                    {/* Macros do Alimento */}
                    {(alimento.calorias || alimento.proteinas || alimento.carboidratos || alimento.gorduras) && (
                      <View style={styles.alimentoMacros}>
                        {alimento.calorias && (
                          <Text style={styles.alimentoMacroText}>
                            {alimento.calorias} kcal
                          </Text>
                        )}
                        {alimento.proteinas && (
                          <Text style={styles.alimentoMacroText}>
                            P: {alimento.proteinas}g
                          </Text>
                        )}
                        {alimento.carboidratos && (
                          <Text style={styles.alimentoMacroText}>
                            C: {alimento.carboidratos}g
                          </Text>
                        )}
                        {alimento.gorduras && (
                          <Text style={styles.alimentoMacroText}>
                            G: {alimento.gorduras}g
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Observações */}
            {refeicao.obs && (
              <View style={styles.obsContainer}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.primary[500]}
                />
                <Text style={styles.obsText}>{refeicao.obs}</Text>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.fallbackCard}>
          <Text style={styles.fallbackTitle}>Informações da Dieta</Text>
          {dieta.conteudo && (
            <Text style={styles.fallbackContent}>{dieta.conteudo}</Text>
          )}
          {dieta.diet_plan && typeof dieta.diet_plan === 'string' && (
            <Text style={styles.fallbackContent}>{dieta.diet_plan}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function getRefeicaoIcon(nome: string): any {
  const nomeLower = nome.toLowerCase();

  if (nomeLower.includes('café') || nomeLower.includes('breakfast')) {
    return 'cafe';
  } else if (nomeLower.includes('almoço') || nomeLower.includes('lunch')) {
    return 'restaurant';
  } else if (nomeLower.includes('jantar') || nomeLower.includes('dinner')) {
    return 'moon';
  } else if (nomeLower.includes('lanche') || nomeLower.includes('snack')) {
    return 'fast-food';
  } else if (nomeLower.includes('ceia')) {
    return 'bed';
  } else if (nomeLower.includes('pré') || nomeLower.includes('pre')) {
    return 'fitness';
  } else if (nomeLower.includes('pós') || nomeLower.includes('post')) {
    return 'barbell';
  }

  return 'nutrition';
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
  refeicaoCard: {
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
  refeicaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refeicaoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  refeicaoInfo: {
    flex: 1,
  },
  refeicaoTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  horarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  horarioText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  macroLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  alimentosContainer: {
    gap: spacing.sm,
  },
  alimentoItem: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  alimentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alimentoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[500],
    marginRight: spacing.sm,
  },
  alimentoNome: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  alimentoQuantidade: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: 14,
    marginBottom: spacing.xs,
  },
  alimentoMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginLeft: 14,
  },
  alimentoMacroText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  obsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.backgroundGray,
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
