import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import ProtocoloView from '@/components/aluno/ProtocoloView';
import { Bell, Sparkles } from 'lucide-react';

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

  // Verificar se tem atualização ANTES de marcar como visualizado
  const hasProtocoloUpdate = protocoloAtivo && protocoloAtivo.viewed_by_aluno === false;

  // Marcar como visualizado
  if (hasProtocoloUpdate) {
    await supabase
      .from('protocolos_hormonais')
      .update({ viewed_by_aluno: true })
      .eq('id', protocoloAtivo.id);
  }

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

        {/* Notificação de Atualização */}
        {hasProtocoloUpdate && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-2 border-orange-400 dark:border-orange-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="text-orange-600 dark:text-orange-400" size={18} />
                  <h3 className="text-base font-bold text-orange-900 dark:text-orange-300">
                    Protocolo Atualizado!
                  </h3>
                </div>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Seu coach fez atualizações no seu protocolo. Confira as mudanças abaixo!
                </p>
              </div>
            </div>
          </div>
        )}

        <ProtocoloView
          alunoId={session.user.id}
          protocoloAtivo={protocoloAtivo}
          historico={historico || []}
        />
      </div>
    </AppLayout>
  );
}
