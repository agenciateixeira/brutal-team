'use client';

import { useState } from 'react';
import { Dieta } from '@/types';
import { Apple, Calendar, FileText, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [showMacros, setShowMacros] = useState(false);

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

            {/* Macronutrientes Expansível */}
            {dietaAtiva.macronutrientes && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowMacros(!showMacros)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 hover:from-green-100 hover:to-blue-100 dark:hover:from-green-900/30 dark:hover:to-blue-900/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Apple size={20} className="text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Tabela de Macronutrientes
                    </span>
                  </div>
                  {showMacros ? (
                    <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {showMacros && (
                  <div className="p-4 bg-white dark:bg-gray-800 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Valores diários recomendados de macronutrientes para sua dieta:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Calorias */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                          Calorias
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dietaAtiva.macronutrientes.calorias}
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">kcal</span>
                        </div>
                      </div>

                      {/* Proteínas */}
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                          Proteínas
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dietaAtiva.macronutrientes.proteinas}
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">g</span>
                        </div>
                      </div>

                      {/* Carboidratos */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                          Carboidratos
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dietaAtiva.macronutrientes.carboidratos}
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">g</span>
                        </div>
                      </div>

                      {/* Gorduras */}
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                          Gorduras
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dietaAtiva.macronutrientes.gorduras}
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">g</span>
                        </div>
                      </div>

                      {/* Fibras (opcional) */}
                      {dietaAtiva.macronutrientes.fibras && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                            Fibras
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {dietaAtiva.macronutrientes.fibras}
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">g</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
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
                      className={`text-gray-400 transition-transform self-end sm:self-center ${
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
      <MealTracker alunoId={alunoId} mealsPerDay={dietaAtiva?.meals_per_day || 6} />
    </div>
  );
}
