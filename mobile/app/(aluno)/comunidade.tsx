import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Post {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  likes_count: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

export default function ComunidadeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComunidade();
  }, []);

  async function loadComunidade() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      setCurrentUserId(user.id);

      // Buscar posts da comunidade
      const { data: postsData } = await supabase
        .from('community_posts')
        .select(
          `
          *,
          profiles:author_id (full_name, avatar_url)
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsData) {
        // Buscar likes do usuário atual
        const { data: userLikes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id);

        const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);

        // Adicionar informação de like aos posts
        const postsWithLikes = postsData.map((post) => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithLikes);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar comunidade:', error);
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadComunidade();
    setRefreshing(false);
  }

  async function handleLike(postId: string) {
    if (!currentUserId) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        // Remover like
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId);

        // Atualizar contador
        await supabase
          .from('community_posts')
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq('id', postId);

        // Atualizar estado local
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: false, likes_count: Math.max(0, p.likes_count - 1) }
              : p
          )
        );
      } else {
        // Adicionar like
        await supabase.from('community_likes').insert({
          post_id: postId,
          user_id: currentUserId,
        });

        // Atualizar contador
        await supabase
          .from('community_posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', postId);

        // Atualizar estado local
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked: true, likes_count: p.likes_count + 1 } : p
          )
        );
      }
    } catch (error) {
      console.error('Erro ao dar like:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post');
    }
  }

  async function handleCreatePost() {
    if (!newPostContent.trim() || !currentUserId) {
      Alert.alert('Atenção', 'Digite algo para postar');
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          content: newPostContent.trim(),
          author_id: currentUserId,
          likes_count: 0,
        })
        .select(
          `
          *,
          profiles:author_id (full_name, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      if (data) {
        // Adicionar novo post ao início da lista
        setPosts((prev) => [{ ...data, isLiked: false }, ...prev]);
        setNewPostContent('');
        setModalVisible(false);
        Alert.alert('Sucesso', 'Post criado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post');
    } finally {
      setPosting(false);
    }
  }

  function renderPost({ item }: { item: Post }) {
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.primary[500]} />
          </View>
          <View style={styles.postInfo}>
            <Text style={styles.authorName}>
              {item.profiles?.full_name || 'Atleta'}
            </Text>
            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, item.isLiked && styles.actionButtonLiked]}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? '#ef4444' : colors.text.secondary}
            />
            <Text
              style={[
                styles.actionText,
                item.isLiked && styles.actionTextLiked,
              ]}
            >
              {item.likes_count || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Comunidade</Text>
        <Text style={styles.subtitle}>Compartilhe seu progresso e interaja</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Nenhuma postagem ainda</Text>
            <Text style={styles.emptyText}>
              Seja o primeiro a compartilhar seu progresso!
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal para criar post */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Post</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Compartilhe seu progresso, conquistas ou motivação..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={6}
              value={newPostContent}
              onChangeText={setNewPostContent}
              maxLength={500}
            />

            <Text style={styles.charCount}>
              {newPostContent.length}/500 caracteres
            </Text>

            <TouchableOpacity
              style={[
                styles.postButton,
                (!newPostContent.trim() || posting) && styles.postButtonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.postButtonText}>Publicar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  headerContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
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
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundGray,
    borderWidth: 2,
    borderColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  postDate: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: fontSize.md * 1.5,
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonLiked: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  actionTextLiked: {
    color: '#ef4444',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postButtonDisabled: {
    backgroundColor: colors.text.tertiary,
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: '#fff',
  },
});
