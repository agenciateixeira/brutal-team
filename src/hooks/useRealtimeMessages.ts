'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeMessagesProps {
  alunoId: string;
  userId: string;
  initialMessages: Message[];
}

export function useRealtimeMessages({ alunoId, userId, initialMessages }: UseRealtimeMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Canal para mensagens
    const messagesChannel = supabase
      .channel(`messages:${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('📨 Nova mensagem recebida:', payload);

          // Buscar dados completos da mensagem com o sender
          const { data: newMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages((current) => [...current, newMessage as Message]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('✏️ Mensagem atualizada:', payload);

          // Buscar dados completos da mensagem atualizada
          const { data: updatedMessage } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (updatedMessage) {
            setMessages((current) =>
              current.map((msg) =>
                msg.id === payload.new.id ? (updatedMessage as Message) : msg
              )
            );
          }
        }
      )
      .subscribe();

    // Canal para indicador de digitação
    const typingChannel = supabase
      .channel(`typing:${alunoId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        console.log('⌨️ Digitando...', payload);

        // Só mostra se for outra pessoa digitando
        if (payload.userId !== userId) {
          setTypingUser(payload.userName);
          setIsTyping(true);

          // Limpar após 3 segundos
          setTimeout(() => {
            setIsTyping(false);
            setTypingUser(null);
          }, 3000);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setIsTyping(false);
          setTypingUser(null);
        }
      })
      .subscribe();

    return () => {
      console.log('🔌 Desconectando canais realtime...');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [alunoId, userId, supabase]);

  // Função para enviar indicador de digitação
  const sendTypingIndicator = async (userName: string) => {
    const channel = supabase.channel(`typing:${alunoId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, userName },
    });
  };

  // Função para parar indicador de digitação
  const stopTypingIndicator = async () => {
    const channel = supabase.channel(`typing:${alunoId}`);
    await channel.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId },
    });
  };

  return {
    messages,
    isTyping,
    typingUser,
    sendTypingIndicator,
    stopTypingIndicator,
  };
}
