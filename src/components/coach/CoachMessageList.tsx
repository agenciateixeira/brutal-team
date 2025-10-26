'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CoachMessageListProps {
  alunoId: string;
  coachId: string;
  messages: Message[];
}

export default function CoachMessageList({
  alunoId,
  coachId,
  messages: initialMessages
}: CoachMessageListProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    console.log('📱 [Coach] Iniciando subscription de mensagens para aluno:', alunoId);

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('💬 [Coach] Nova mensagem recebida:', payload);

          // Buscar dados completos da mensagem com o sender
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (!error && newMessage) {
            console.log('✅ [Coach] Mensagem completa carregada:', newMessage);
            // Adicionar nova mensagem ao state
            setMessages((prev) => [...prev, newMessage as Message]);
          } else {
            console.error('❌ [Coach] Erro ao carregar mensagem:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [Coach] Status da subscription:', status);
      });

    // Reconectar quando a página volta a ficar visível (importante para mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [Coach] Página voltou a ficar visível, verificando conexão...');
        const channelState = channel.state;
        if (channelState === 'closed' || channelState === 'errored') {
          console.log('🔄 [Coach] Reconectando canal...');
          supabase.removeChannel(channel);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🔌 [Coach] Removendo subscription de mensagens');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [alunoId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        aluno_id: alunoId,
        sender_id: coachId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      // Não precisa mais de router.refresh()
      // A mensagem será adicionada automaticamente via realtime
    } catch (error: any) {
      alert('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg) => {
          const isFromCoach = msg.sender_id === coachId;
          return (
            <div
              key={msg.id}
              className={`flex ${isFromCoach ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  isFromCoach
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
