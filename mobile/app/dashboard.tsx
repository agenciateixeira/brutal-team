import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { colors, spacing, borderRadius, fontSize } from '../lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || user.email);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <Text style={styles.welcome}>Bem-vindo!</Text>
        <Text style={styles.userName}>{userName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Dashboard</Text>
          <Text style={styles.cardText}>
            O app mobile está funcionando!{'\n\n'}
            Em breve teremos aqui:{'\n'}
            • Treinos do dia{'\n'}
            • Dieta personalizada{'\n'}
            • Progresso e gamificação{'\n'}
            • Comunidade
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 - MVP Mobile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // #011936
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  userName: {
    fontSize: fontSize.lg,
    color: colors.text.secondary, // #93B7BE
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface, // #001a21
    borderWidth: 1,
    borderColor: colors.primary[700], // #004d64
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: colors.surfaceLight, // #003443
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  version: {
    textAlign: 'center',
    color: colors.text.tertiary, // #465362
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
  },
});
