import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    color: '#999',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  version: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 20,
  },
});
