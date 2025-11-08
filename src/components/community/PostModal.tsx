'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  id: string;
  aluno_id: string;
  photo_url: string | null;
  caption: string | null;
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
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, post.id]);

  const loadData = async () => {
    // Carregar curtidas
    const { data: likesData } = await supabase
      .from('community_likes')
      .select('id, aluno_id')
      .eq('post_id', post.id);

    if (likesData) {
      setLikes(likesData);
      setIsLiked(likesData.some((like: any) => like.aluno_id === currentUserId));
    }

    // Carregar comentários
    const { data: commentsData } = await supabase
      .from('community_comments')
      .select('id, aluno_id, comment, created_at, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (commentsData) {
      setComments(commentsData);
    }
  };

  const handleLike = async () => {
    if (loading) return;

    const wasLiked = isLiked;
    const currentLikes = [...likes];

    // ✅ ATUALIZAÇÃO OTIMISTA - Atualiza UI imediatamente
    setIsLiked(!wasLiked);
    if (wasLiked) {
      // Remover curtida da UI
      setLikes(likes.filter(like => like.aluno_id !== currentUserId));
    } else {
      // Adicionar curtida na UI
      setLikes([...likes, { id: 'temp', aluno_id: currentUserId }]);
    }

    setLoading(true);

    // 🔥 Sincronizar com banco de dados em background
    try {
      if (wasLiked) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('aluno_id', currentUserId);
      } else {
        await supabase
          .from('community_likes')
          .insert({ post_id: post.id, aluno_id: currentUserId });
      }
      // Recarregar dados para ter certeza que está sincronizado
      await loadData();
    } catch (error) {
      console.error('Erro ao curtir:', error);
      // Reverter mudanças em caso de erro
      setIsLiked(wasLiked);
      setLikes(currentLikes);
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
      await loadData();
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
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className={`relative w-full h-full md:h-auto md:w-full ${post.photo_url ? 'md:max-w-5xl' : 'md:max-w-2xl'} md:max-h-[85vh] bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row`}>
        {/* Foto (se houver) */}
        {post.photo_url && (
          <div className="relative w-full md:w-3/5 aspect-square md:aspect-auto bg-black flex items-center justify-center">
            <Image
              src={post.photo_url}
              alt="Post"
              fill
              className="object-contain"
              priority
            />

            {/* Botão fechar desktop */}
            <button
              onClick={onClose}
              className="hidden md:block absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Sidebar */}
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
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {post.profiles.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Botão fechar mobile + desktop (quando não tem foto) */}
            <button
              onClick={onClose}
              className={`${post.photo_url ? 'md:hidden' : ''} p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Legenda */}
          {post.caption && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap">
                <span className="font-bold">{post.profiles.full_name}</span> {post.caption}
              </p>
            </div>
          )}

          {/* Comentários */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">Nenhum comentário ainda</p>
              </div>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gray-600 to-gray-800 flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <Image
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.full_name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {comment.profiles?.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {comment.profiles?.full_name}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words overflow-wrap-anywhere whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                      </span>

                      {comment.aluno_id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100"
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

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Ações */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Heart
                  size={24}
                  className={isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'}
                />
                <span className="text-sm font-semibold">{likes.length}</span>
              </button>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Adicione um comentário..."
                maxLength={200}
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                disabled={submittingComment}
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim() || submittingComment}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full disabled:opacity-50"
              >
                {submittingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
