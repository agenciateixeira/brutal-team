'use client';

import { useState } from 'react';
import { Treino } from '@/types';
import { Dumbbell, Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtimeTreinos } from '@/hooks/useRealtimeTreinos';
import WorkoutTracker from '@/components/aluno/WorkoutTracker';
import TreinoParser from '@/components/aluno/TreinoParser';
import WelcomeMessage from '@/components/aluno/WelcomeMessage';

interface TreinoViewProps {
  alunoId: string;
  treinoAtivo: Treino | null;
  historico: Treino[];
}

export default function TreinoView({ alunoId, treinoAtivo: initialTreinoAtivo, historico: initialHistorico }: TreinoViewProps) {
  const [showHistorico, setShowHistorico] = useState(false);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);

  // Hook de realtime
  const { treinos, treinoAtivo } = useRealtimeTreinos(alunoId, initialHistorico);

  return (
    <div className="space-y-6">
      {/* Treino Ativo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell size={24} className="text-accent-600" />
            Treino Atual
          </h2>
          {treinoAtivo && (
            <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-sm font-semibold rounded-full">
              Ativo
            </span>
          )}
        </div>

        {treinoAtivo ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {treinoAtivo.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Criado em {format(new Date(treinoAtivo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {treinoAtivo.updated_at !== treinoAtivo.created_at && (
                  <span className="flex items-center gap-1">
                    <FileText size={16} />
                    Atualizado em {format(new Date(treinoAtivo.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <TreinoParser content={treinoAtivo.content} />
            </div>
          </div>
        ) : (
          <WelcomeMessage type="workout" />
        )}
      </div>

      {/* Histórico */}
      {treinos.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={24} className="text-gray-600 dark:text-gray-400" />
              Histórico de Treinos ({treinos.length})
            </h2>
            <ChevronRight
              size={20}
              className={`text-gray-400 transition-transform ${
                showHistorico ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showHistorico && (
            <div className="space-y-3">
              {treinos.map((treino) => (
                <div
                  key={treino.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    treino.active
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTreino(selectedTreino?.id === treino.id ? null : treino)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {treino.title}
                        {treino.active && (
                          <span className="px-2 py-0.5 bg-accent-600 text-white text-xs rounded-full">
                            Ativo
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(treino.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform self-end sm:self-center ${
                        selectedTreino?.id === treino.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {selectedTreino?.id === treino.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <TreinoParser content={treino.content} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking de Treinos */}
      <WorkoutTracker alunoId={alunoId} workoutTypes={treinoAtivo?.workout_types || ['musculacao']} />
    </div>
  );
}
