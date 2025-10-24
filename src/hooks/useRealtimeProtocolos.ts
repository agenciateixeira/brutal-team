'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProtocoloHormonal } from '@/types';

export function useRealtimeProtocolos(alunoId: string, initialProtocolos: ProtocoloHormonal[]) {
  const [protocolos, setProtocolos] = useState<ProtocoloHormonal[]>(initialProtocolos);
  const [protocoloAtivo, setProtocoloAtivo] = useState<ProtocoloHormonal | null>(
    initialProtocolos.find(p => p.active) || null
  );
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`protocolos:${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'protocolos_hormonais',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('💉 Mudança em protocolos hormonais:', payload);

          // Recarregar todos os protocolos
          const { data } = await supabase
            .from('protocolos_hormonais')
            .select('*')
            .eq('aluno_id', alunoId)
            .order('created_at', { ascending: false });

          if (data) {
            setProtocolos(data);
            setProtocoloAtivo(data.find(p => p.active) || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId, supabase]);

  return { protocolos, protocoloAtivo };
}
