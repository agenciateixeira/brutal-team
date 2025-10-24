'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dieta } from '@/types';

export function useRealtimeDietas(alunoId: string, initialDietas: Dieta[]) {
  const [dietas, setDietas] = useState<Dieta[]>(initialDietas);
  const [dietaAtiva, setDietaAtiva] = useState<Dieta | null>(
    initialDietas.find(d => d.active) || null
  );
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`dietas:${alunoId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'dietas',
          filter: `aluno_id=eq.${alunoId}`,
        },
        async (payload) => {
          console.log('🍎 Mudança em dietas:', payload);

          // Recarregar todas as dietas
          const { data } = await supabase
            .from('dietas')
            .select('*')
            .eq('aluno_id', alunoId)
            .order('created_at', { ascending: false });

          if (data) {
            setDietas(data);
            setDietaAtiva(data.find(d => d.active) || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId, supabase]);

  return { dietas, dietaAtiva };
}
