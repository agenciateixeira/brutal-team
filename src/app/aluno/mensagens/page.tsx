import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ChatFull from '@/components/aluno/ChatFull';

export default async function MensagensPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  // Buscar mensagens
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .eq('aluno_id', session.user.id)
    .order('created_at', { ascending: true });

  // Buscar informações do coach
  const { data: coach } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'coach')
    .single();

  return (
    <AppLayout profile={profile}>
      <div className="h-[calc(100vh-8rem)]">
        <ChatFull
          alunoId={session.user.id}
          messages={messages || []}
          coach={coach}
        />
      </div>
    </AppLayout>
  );
}
