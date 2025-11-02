'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Message, Profile } from '@/types';
import { Send, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendPushNotification } from '@/lib/push-notifications';

interface ChatFullProps {
  alunoId: string;
  messages: Message[];
  coach: Profile | null;
}

export default function ChatFull({ alunoId, messages: initialMessages, coach }: ChatFullProps) {
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
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `aluno_id=eq.${alunoId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId, router, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('messages').insert({
        aluno_id: alunoId,
        sender_id: user!.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      // Buscar informações do aluno e coach para enviar notificação
      console.log('🔔 [MENSAGEM] Buscando informações do aluno para notificar coach...');
      const { data: alunoProfile, error: profileError } = await supabase
        .from('profiles')
        .select('coach_id, full_name')
        .eq('id', alunoId)
        .single();

      console.log('🔔 [MENSAGEM] Dados do aluno:', alunoProfile);
      console.log('🔔 [MENSAGEM] Erro ao buscar perfil:', profileError);

      if (alunoProfile?.coach_id) {
        console.log('🔔 [MENSAGEM] Coach ID encontrado:', alunoProfile.coach_id);
        try {
          // Enviar notificação push para o coach
          console.log('🔔 [MENSAGEM] Enviando notificação push...');
          const result = await sendPushNotification({
            userId: alunoProfile.coach_id,
            title: '💬 Nova Mensagem!',
            body: `${alunoProfile.full_name || 'Seu aluno'}: ${newMessage.trim().substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
            url: `/coach/aluno/${alunoId}`,
            data: {
              type: 'message',
              alunoId: alunoId,
            },
          });
          console.log('✅ [MENSAGEM] Notificação enviada com sucesso!', result);
        } catch (pushError) {
          console.error('❌ [MENSAGEM] Erro ao enviar notificação:', pushError);
          // Não falhar a operação principal
        }
      } else {
        console.log('⚠️ [MENSAGEM] Coach ID não encontrado no perfil do aluno');
      }

      setNewMessage('');
      router.refresh();
    } catch (error: any) {
      alert('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
            {coach?.full_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {coach?.full_name || 'Coach'}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhuma mensagem ainda
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Envie uma mensagem para seu coach
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isFromAluno = msg.sender_id === alunoId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromAluno ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[70%] space-y-1">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isFromAluno
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </form>
    </div>
  );
}
