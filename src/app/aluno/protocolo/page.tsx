import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ProtocoloView from '@/components/aluno/ProtocoloView';

export default async function ProtocoloPage() {
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

  // Buscar protocolo ativo
  const { data: protocoloAtivo } = await supabase
    .from('protocolos_hormonais')
    .select('*')
    .eq('aluno_id', session.user.id)
    .eq('active', true)
    .single();

  // Buscar histórico de protocolos
  const { data: historico } = await supabase
    .from('protocolos_hormonais')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Protocolo Hormonal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe seu protocolo de suplementação hormonal
          </p>
        </div>

        <ProtocoloView
          alunoId={session.user.id}
          protocoloAtivo={protocoloAtivo}
          historico={historico || []}
        />
      </div>
    </AppLayout>
  );
}
