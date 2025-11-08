'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, ImageOff, MoreVertical, Send, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PostModal from './PostModal';

interface Post {
  id: string;
  aluno_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface CommunityFeedProps {
  initialPosts: Post[];
  currentUserId: string;
}

export default function CommunityFeed({ initialPosts, currentUserId }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadInteractions();
    setupRealtimeSubscriptions();
  }, []);

  const loadInteractions = async () => {
    // Carregar curtidas
    const { data: likes } = await supabase
      .from('community_likes')
      .select('post_id, aluno_id');

    if (likes) {
      const counts: Record<string, number> = {};
      const userLikedPosts = new Set<string>();

      likes.forEach((like: any) => {
        counts[like.post_id] = (counts[like.post_id] || 0) + 1;
        if (like.aluno_id === currentUserId) {
          userLikedPosts.add(like.post_id);
        }
      });

      setLikesCount(counts);
      setUserLikes(userLikedPosts);
    }

    // Carregar comentários
    const { data: comments } = await supabase
      .from('community_comments')
      .select('post_id');

    if (comments) {
      const counts: Record<string, number> = {};
      comments.forEach((comment: any) => {
        counts[comment.post_id] = (counts[comment.post_id] || 0) + 1;
      });
      setCommentsCount(counts);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new posts (REAL-TIME)
    const postsChannel = supabase
      .channel('community-posts-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts',
      }, async (payload) => {
        // Buscar dados completos do novo post
        const { data: newPost } = await supabase
          .from('community_posts')
          .select('*, profiles(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();

        if (newPost) {
          setPosts(prev => [newPost as Post, ...prev]);
        }
      })
      .subscribe();

    // Subscribe to likes changes (REAL-TIME)
    const likesChannel = supabase
      .channel('community-likes-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_likes',
      }, () => {
        loadInteractions();
      })
      .subscribe();

    // Subscribe to comments changes (REAL-TIME)
    const commentsChannel = supabase
      .channel('community-comments-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments',
      }, () => {
        loadInteractions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  };

  const handleQuickLike = async (postId: string) => {
    const isLiked = userLikes.has(postId);
    const currentCount = likesCount[postId] || 0;

    // ✅ ATUALIZAÇÃO OTIMISTA - Atualiza UI imediatamente
    if (isLiked) {
      // Remover curtida da UI
      setUserLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setLikesCount(prev => ({ ...prev, [postId]: Math.max(0, currentCount - 1) }));
    } else {
      // Adicionar curtida na UI
      setUserLikes(prev => new Set([...prev, postId]));
      setLikesCount(prev => ({ ...prev, [postId]: currentCount + 1 }));
    }

    // 🔥 Sincronizar com banco de dados em background
    try {
      if (isLiked) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('aluno_id', currentUserId);
      } else {
        await supabase
          .from('community_likes')
          .insert({
            post_id: postId,
            aluno_id: currentUserId,
          });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      // Reverter mudanças em caso de erro
      if (isLiked) {
        setUserLikes(prev => new Set([...prev, postId]));
        setLikesCount(prev => ({ ...prev, [postId]: currentCount }));
      } else {
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setLikesCount(prev => ({ ...prev, [postId]: currentCount }));
      }
    }
  };

  const handleInlineComment = async (postId: string) => {
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);

    // ✅ ATUALIZAÇÃO OTIMISTA - Atualiza contagem imediatamente
    const currentCount = commentsCount[postId] || 0;
    setCommentsCount(prev => ({ ...prev, [postId]: currentCount + 1 }));

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          aluno_id: currentUserId,
          comment: newComment.trim(),
        });

      if (error) {
        console.error('Erro ao inserir comentário:', error);
        // Reverter contagem em caso de erro
        setCommentsCount(prev => ({ ...prev, [postId]: currentCount }));
      } else {
        // ✅ Comentário inserido com sucesso!
        setNewComment('');
        setCommentingPostId(null);

        // Recarregar dados para garantir sincronização
        await loadInteractions();
      }
    } catch (error) {
      console.error('Erro ao comentar:', error);
      // Reverter contagem em caso de erro
      setCommentsCount(prev => ({ ...prev, [postId]: currentCount }));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setDeletingPostId(postToDelete);
    setShowDeleteModal(false);

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postToDelete);

      if (error) {
        console.error('Erro ao deletar post:', error);
        alert('Erro ao deletar post. Tente novamente.');
      } else {
        // Remover post da lista local
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
      }
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      alert('Erro ao deletar post. Tente novamente.');
    } finally {
      setDeletingPostId(null);
      setPostToDelete(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <ImageOff className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Nenhum post ainda
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Seja o primeiro a postar seu treino do dia!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Feed estilo Instagram - COLUNA ÚNICA */}
      <div className="max-w-xl mx-auto space-y-6">
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header do Post */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-600 to-blue-600 flex-shrink-0">
                  {post.profiles.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url}
                      alt={post.profiles.full_name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {post.profiles.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Nome e tempo */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {post.profiles.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Menu - Só aparece nos próprios posts */}
              {post.aluno_id === currentUserId && (
                <button
                  onClick={() => {
                    setPostToDelete(post.id);
                    setShowDeleteModal(true);
                  }}
                  disabled={deletingPostId === post.id}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                  title="Deletar post"
                >
                  {deletingPostId === post.id ? (
                    <Loader2 size={18} className="text-red-600 animate-spin" />
                  ) : (
                    <Trash2 size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-red-600" />
                  )}
                </button>
              )}
            </div>

            {/* Foto do Post */}
            <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-900">
              <Image
                src={post.photo_url}
                alt="Post"
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                priority={index < 2}
              />
            </div>

            {/* Ações e Info */}
            <div className="p-4 space-y-2">
              {/* Botões de ação */}
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLike(post.id);
                  }}
                  className="transition-transform active:scale-90"
                >
                  <Heart
                    size={24}
                    className={`transition-colors ${
                      userLikes.has(post.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400'
                    }`}
                  />
                </button>

                {/* Mobile: abre campo inline | Desktop: abre modal */}
                <button
                  onClick={() => {
                    // Mobile: toggle campo inline
                    if (window.innerWidth < 768) {
                      setCommentingPostId(commentingPostId === post.id ? null : post.id);
                      setNewComment('');
                    } else {
                      // Desktop: abre modal
                      setSelectedPost(post);
                    }
                  }}
                  className="transition-transform active:scale-90"
                >
                  <MessageCircle
                    size={24}
                    className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  />
                </button>
              </div>

              {/* Contagem de curtidas */}
              {likesCount[post.id] > 0 && (
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {likesCount[post.id]} {likesCount[post.id] === 1 ? 'curtida' : 'curtidas'}
                </p>
              )}

              {/* Legenda */}
              {post.caption && (
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-bold mr-2">{post.profiles.full_name}</span>
                  {post.caption}
                </p>
              )}

              {/* Ver comentários */}
              {commentsCount[post.id] > 0 && (
                <button
                  onClick={() => setSelectedPost(post)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Ver {commentsCount[post.id] === 1 ? 'o' : 'todos os'} {commentsCount[post.id]} {commentsCount[post.id] === 1 ? 'comentário' : 'comentários'}
                </button>
              )}

              {/* 📱 CAMPO DE COMENTÁRIO INLINE (Mobile) - Estilo Instagram */}
              {commentingPostId === post.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleInlineComment(post.id)}
                      placeholder="Adicione um comentário..."
                      maxLength={200}
                      autoFocus
                      disabled={submittingComment}
                      className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={() => handleInlineComment(post.id)}
                      disabled={!newComment.trim() || submittingComment}
                      className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {/* Modal de confirmação de delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => {
              setShowDeleteModal(false);
              setPostToDelete(null);
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Deletar post?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Esta ação não pode ser desfeita. O post e todos os comentários serão removidos permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Deletar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de visualização */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUserId={currentUserId}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
