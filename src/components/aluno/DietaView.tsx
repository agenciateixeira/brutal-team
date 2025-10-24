'use client';

import { useState } from 'react';
import { Dieta } from '@/types';
import { Apple, Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtimeDietas } from '@/hooks/useRealtimeDietas';
import MealTracker from '@/components/aluno/MealTracker';

interface DietaViewProps {
  alunoId: string;
  dietaAtiva: Dieta | null;
  historico: Dieta[];
}

export default function DietaView({ alunoId, dietaAtiva: initialDietaAtiva, historico: initialHistorico }: DietaViewProps) {
  const [showHistorico, setShowHistorico] = useState(false);
  const [selectedDieta, setSelectedDieta] = useState<Dieta | null>(null);

  // Hook de realtime
  const { dietas, dietaAtiva } = useRealtimeDietas(alunoId, initialHistorico);

  return (
    <div className="space-y-6">
      {/* Dieta Ativa */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Apple size={24} className="text-green-600" />
            Dieta Atual
          </h2>
          {dietaAtiva && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-semibold rounded-full">
              Ativa
            </span>
          )}
        </div>

        {dietaAtiva ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {dietaAtiva.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Criada em {format(new Date(dietaAtiva.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {dietaAtiva.updated_at !== dietaAtiva.created_at && (
                  <span className="flex items-center gap-1">
                    <FileText size={16} />
                    Atualizada em {format(new Date(dietaAtiva.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-sans text-sm leading-relaxed">
                {dietaAtiva.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Apple size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhuma dieta ativa no momento
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Aguarde seu coach enviar sua dieta personalizada
            </p>
          </div>
        )}
      </div>

      {/* Histórico */}
      {dietas.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={24} className="text-gray-600 dark:text-gray-400" />
              Histórico de Dietas ({dietas.length})
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
              {dietas.map((dieta) => (
                <div
                  key={dieta.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    dieta.active
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedDieta(selectedDieta?.id === dieta.id ? null : dieta)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {dieta.title}
                        {dieta.active && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                            Ativa
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(dieta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        selectedDieta?.id === dieta.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {selectedDieta?.id === dieta.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans text-sm leading-relaxed">
                        {dieta.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking de Refeições */}
      <MealTracker alunoId={alunoId} />
    </div>
  );
}
