'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Treino } from '@/types';

export function useRealtimeTreinos(alunoId: string, initialTreinos: Treino[]) {
  const [treinos, setTreinos] = useState<Treino[]>(initialTreinos);
  const [treinoAtivo, setTreinoAtivo] = useState<Treino | null>(
    initialTreinos.find(t => t.active) || null
  );
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`treinos:${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'treinos',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('💪 Mudança em treinos:', payload);

          // Recarregar todos os treinos
          const { data } = await supabase
            .from('treinos')
            .select('*')
            .eq('aluno_id', alunoId)
            .order('created_at', { ascending: false });

          if (data) {
            setTreinos(data);
            setTreinoAtivo(data.find(t => t.active) || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId, supabase]);

  return { treinos, treinoAtivo };
}
