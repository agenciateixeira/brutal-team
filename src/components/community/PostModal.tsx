'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Send, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface Like {
  id: string;
  aluno_id: string;
  profiles: {
    full_name: string;
  };
}

interface Comment {
  id: string;
  aluno_id: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface PostModalProps {
  post: Post;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ post, currentUserId, isOpen, onClose }: PostModalProps) {
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Carregar likes e comments
  useEffect(() => {
    if (isOpen) {
      loadLikes();
      loadComments();
      setupRealtimeSubscriptions();
    }
  }, [isOpen, post.id]);

  const loadLikes = async () => {
    const { data } = await supabase
      .from('community_likes')
      .select('id, aluno_id, profiles(full_name)')
      .eq('post_id', post.id);

    if (data) {
      setLikes(data as Like[]);
      setIsLiked(data.some(like => like.aluno_id === currentUserId));
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('community_comments')
      .select('id, aluno_id, comment, created_at, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as Comment[]);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to likes
    const likesChannel = supabase
      .channel(`post-likes-${post.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_likes',
        filter: `post_id=eq.${post.id}`,
      }, () => {
        loadLikes();
      })
      .subscribe();

    // Subscribe to comments
    const commentsChannel = supabase
      .channel(`post-comments-${post.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments',
        filter: `post_id=eq.${post.id}`,
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  };

  const handleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        // Remover curtida
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('aluno_id', currentUserId);
      } else {
        // Adicionar curtida
        await supabase
          .from('community_likes')
          .insert({
            post_id: post.id,
            aluno_id: currentUserId,
          });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await supabase
        .from('community_comments')
        .insert({
          post_id: post.id,
          aluno_id: currentUserId,
          comment: newComment.trim(),
        });

      setNewComment('');
      commentInputRef.current?.focus();
    } catch (error) {
      console.error('Erro ao comentar:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId);
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal - PERFEITAMENTE CENTRALIZADO E RESPONSIVO */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full md:h-auto md:w-full md:max-w-5xl md:max-h-[85vh] bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto"
            >
          {/* Foto (Esquerda no desktop, topo no mobile) */}
          <div className="relative w-full md:w-3/5 aspect-square md:aspect-auto bg-black flex items-center justify-center md:max-h-[85vh]">
          <Image
            src={post.photo_url}
            alt="Post"
            fill
            className="object-contain"
            priority
          />

          {/* Botão fechar (desktop) */}
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar (Direita no desktop, baixo no mobile) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 max-h-[50vh] md:max-h-none">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-600 to-blue-600">
                {post.profiles.avatar_url ? (
                  <Image
                    src={post.profiles.avatar_url}
                    alt={post.profiles.full_name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {post.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  {post.profiles.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Botão fechar (mobile) */}
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Legenda */}
          {post.caption && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white text-sm">
                <span className="font-bold">{post.profiles.full_name}</span> {post.caption}
              </p>
            </div>
          )}

          {/* Comentários */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum comentário ainda
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Seja o primeiro a comentar!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-600 to-gray-800 flex-shrink-0">
                    {comment.profiles.avatar_url ? (
                      <Image
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.full_name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {comment.profiles.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {comment.profiles.full_name}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {comment.comment}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                      </span>

                      {/* Botão deletar (só aparece para o próprio comentário) */}
                      {comment.aluno_id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Likes + Input de Comentário */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Ações */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={loading}
                className="flex items-center gap-2 group transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Heart
                  size={24}
                  className={`transition-colors ${
                    isLiked
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-red-500'
                  }`}
                />
              </button>
              <button
                onClick={() => commentInputRef.current?.focus()}
                className="flex items-center gap-2 group transition-transform hover:scale-110"
              >
                <MessageCircle
                  size={24}
                  className="text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition-colors"
                />
              </button>
            </div>

            {/* Contagem de curtidas */}
            {likes.length > 0 && (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {likes.length} {likes.length === 1 ? 'curtida' : 'curtidas'}
              </p>
            )}

            {/* Input de comentário */}
            <div className="flex items-center gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Adicione um comentário..."
                maxLength={200}
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={submittingComment}
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim() || submittingComment}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
