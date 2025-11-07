'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Flame, ImageOff } from 'lucide-react';
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
      // Contar curtidas por post
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
    // Subscribe to new posts
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

    // Subscribe to likes changes
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

    // Subscribe to comments changes
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

    try {
      if (isLiked) {
        // Remover curtida
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('aluno_id', currentUserId);
      } else {
        // Adicionar curtida
        await supabase
          .from('community_likes')
          .insert({
            post_id: postId,
            aluno_id: currentUserId,
          });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <ImageOff className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Nenhum post ainda
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Seja o primeiro a postar seu treino do dia!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-primary-600 font-semibold">
          <Flame size={16} />
          <span>Clique no botão + para postar</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            {/* Card do Post */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              {/* Header */}
              <div className="p-3 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-600 to-blue-600 flex-shrink-0">
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
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {post.profiles.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Foto */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                <Image
                  src={post.photo_url}
                  alt="Post"
                  fill
                  className="object-cover"
                />

                {/* Overlay com interações (aparece no hover no desktop) */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <Heart className="fill-white" size={24} />
                    <span>{likesCount[post.id] || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                    <MessageCircle className="fill-white" size={24} />
                    <span>{commentsCount[post.id] || 0}</span>
                  </div>
                </div>
              </div>

              {/* Footer com ações */}
              <div className="p-3 space-y-2">
                {/* Botões de ação */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLike(post.id);
                    }}
                    className="flex items-center gap-1 group/like transition-transform hover:scale-110"
                  >
                    <Heart
                      size={20}
                      className={`transition-colors ${
                        userLikes.has(post.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-700 dark:text-gray-300 group-hover/like:text-red-500'
                      }`}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {likesCount[post.id] || 0}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                    }}
                    className="flex items-center gap-1 group/comment transition-transform hover:scale-110"
                  >
                    <MessageCircle
                      size={20}
                      className="text-gray-700 dark:text-gray-300 group-hover/comment:text-primary-500 transition-colors"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {commentsCount[post.id] || 0}
                    </span>
                  </button>
                </div>

                {/* Legenda */}
                {post.caption && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    <span className="font-bold">{post.profiles.full_name}</span> {post.caption}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
