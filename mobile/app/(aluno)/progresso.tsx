import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.lg * 3) / 2;

interface ProgressPhoto {
  id: string;
  aluno_id: string;
  photo_url: string;
  date: string;
  created_at: string;
  notes?: string;
}

export default function ProgressoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProgressPhotos();
    requestPermissions();
  }, []);

  async function requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar suas fotos'
      );
    }
  }

  async function loadProgressPhotos() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('aluno_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadProgressPhotos();
    setRefreshing(false);
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  }

  async function uploadPhoto(uri: string) {
    if (!currentUserId) return;

    setUploading(true);
    try {
      // Converter URI para blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Gerar nome único para o arquivo
      const fileExt = uri.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('progress-photos').getPublicUrl(fileName);

      // Salvar no banco
      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          aluno_id: currentUserId,
          photo_url: publicUrl,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Adicionar à lista
      setPhotos((prev) => [photoData, ...prev]);
      Alert.alert('Sucesso', 'Foto adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Não foi possível fazer upload da foto');
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(photo: ProgressPhoto) {
    Alert.alert(
      'Excluir foto',
      'Tem certeza que deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Extrair caminho do arquivo da URL
              const fileName = photo.photo_url.split('/').slice(-2).join('/');

              // Deletar do storage
              await supabase.storage.from('progress-photos').remove([fileName]);

              // Deletar do banco
              await supabase.from('progress_photos').delete().eq('id', photo.id);

              // Remover da lista
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
              Alert.alert('Sucesso', 'Foto excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir foto:', error);
              Alert.alert('Erro', 'Não foi possível excluir a foto');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
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
            <Ionicons name="trending-up" size={32} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>Progresso</Text>
          <Text style={styles.subtitle}>
            Acompanhe sua evolução através de fotos
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{photos.length}</Text>
            <Text style={styles.statLabel}>Fotos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {photos.length > 0
                ? Math.floor(
                    (new Date().getTime() -
                      new Date(photos[photos.length - 1].date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0}
            </Text>
            <Text style={styles.statLabel}>Dias</Text>
          </View>
        </View>

        {/* Add Photo Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar Nova Foto</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <View style={styles.photosGrid}>
            {photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoCard}
                onLongPress={() => deletePhoto(photo)}
              >
                <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoDate}>
                    {new Date(photo.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
            <Text style={styles.emptyText}>
              Comece a documentar sua evolução adicionando fotos de progresso
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#fff',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoCard: {
    width: imageSize,
    height: imageSize * 1.3,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.sm,
  },
  photoDate: {
    fontSize: fontSize.xs,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
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
});
