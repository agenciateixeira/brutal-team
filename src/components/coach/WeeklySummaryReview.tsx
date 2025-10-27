'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle, Send, Image as ImageIcon, Calendar, Scale, Activity, Dumbbell, Droplet, Moon, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface WeeklySummary {
  id: string;
  aluno_id: string;
  aluno_name: string;
  aluno_photo?: string;
  week_of_month: number;
  month: number;
  year: number;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  waist_measurement?: number;
  chest_measurement?: number;
  arm_measurement?: number;
  leg_measurement?: number;
  seguiu_dieta: boolean;
  problema_refeicao?: string;
  consumo_agua_sim?: string;
  qualidade_sono_sim?: string;
  dia_nao_seguiu?: string;
  refeicoes_fora_casa?: number;
  consumo_agua_nao?: string;
  qualidade_sono_nao?: string;
  faltou_treino: boolean;
  quantos_dias_faltou?: number;
  desempenho_treino?: string;
  horario_treino_proxima_semana?: string;
  front_photo_url?: string;
  side_photo_url?: string;
  back_photo_url?: string;
  coach_feedback?: string;
  task_completed: boolean;
  submission_order: number;
  created_at: string;
}

interface WeeklySummaryReviewProps {
  summaries: WeeklySummary[];
}

export default function WeeklySummaryReview({ summaries }: WeeklySummaryReviewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekNames = ['1ª', '2ª', '3ª', '4ª'];

  const handleSendFeedback = async (summaryId: string) => {
    const feedback = feedbacks[summaryId];

    if (!feedback || feedback.trim() === '') {
      setToast({ type: 'error', message: 'Por favor, escreva um feedback' });
      return;
    }

    setProcessing(summaryId);

    try {
      const { error } = await supabase
        .from('weekly_summary')
        .update({
          coach_feedback: feedback,
          coach_feedback_sent_at: new Date().toISOString(),
        })
        .eq('id', summaryId);

      if (error) throw error;

      setToast({ type: 'success', message: 'Feedback enviado com sucesso!' });
      router.refresh();
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      setToast({ type: 'error', message: `Erro ao enviar: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkComplete = async (summaryId: string) => {
    if (!confirm('Marcar este resumo como concluído? O aluno irá para o final da fila.')) return;

    setProcessing(summaryId);

    try {
      const { error } = await supabase
        .from('weekly_summary')
        .update({
          task_completed: true,
          task_completed_at: new Date().toISOString(),
          viewed_by_coach: true,
          viewed_at: new Date().toISOString(),
        })
        .eq('id', summaryId);

      if (error) throw error;

      setToast({ type: 'success', message: 'Resumo marcado como concluído!' });

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao marcar como concluído:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
    } finally {
      setProcessing(null);
    }
  };

  // Ordenar: não concluídos primeiro (por submission_order), depois concluídos
  const sortedSummaries = [...summaries].sort((a, b) => {
    if (a.task_completed === b.task_completed) {
      return a.submission_order - b.submission_order;
    }
    return a.task_completed ? 1 : -1;
  });

  const pendingSummaries = sortedSummaries.filter(s => !s.task_completed);
  const completedSummaries = sortedSummaries.filter(s => s.task_completed);

  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum Resumo Semanal
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Ainda não há resumos semanais enviados pelos alunos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pendentes */}
        {pendingSummaries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-yellow-600" />
              Pendentes de Revisão ({pendingSummaries.length})
            </h3>

            <div className="space-y-4">
              {pendingSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-yellow-400 dark:border-yellow-600 overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                    onClick={() => setExpandedId(expandedId === summary.id ? null : summary.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {summary.aluno_photo ? (
                          <img
                            src={summary.aluno_photo}
                            alt={summary.aluno_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                              {summary.aluno_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {summary.aluno_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {weekNames[summary.week_of_month - 1]} semana de {monthNames[summary.month - 1]} {summary.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enviado em {new Date(summary.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            #{summary.submission_order} na fila
                          </p>
                        </div>
                        {expandedId === summary.id ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo Expandido */}
                  {expandedId === summary.id && (
                    <div className="p-6 space-y-6 border-t border-yellow-200 dark:border-yellow-800">
                      {/* Medidas */}
                      {(summary.weight || summary.waist_measurement || summary.arm_measurement) && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Scale size={16} />
                            Medidas Corporais
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {summary.weight && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Peso:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{summary.weight} kg</span>
                              </div>
                            )}
                            {summary.body_fat_percentage && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Gordura:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{summary.body_fat_percentage}%</span>
                              </div>
                            )}
                            {summary.waist_measurement && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Cintura:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{summary.waist_measurement} cm</span>
                              </div>
                            )}
                            {summary.arm_measurement && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Braço:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{summary.arm_measurement} cm</span>
                              </div>
                            )}
                            {summary.leg_measurement && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Perna:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{summary.leg_measurement} cm</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dieta */}
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Activity size={16} />
                          Sobre a Dieta
                        </h5>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Seguiu a dieta?</strong>{' '}
                            <span className={summary.seguiu_dieta ? 'text-green-600' : 'text-red-600'}>
                              {summary.seguiu_dieta ? '✅ SIM' : '❌ NÃO'}
                            </span>
                          </p>

                          {summary.seguiu_dieta ? (
                            <>
                              {summary.problema_refeicao && (
                                <p><strong>Problema em refeição:</strong> {summary.problema_refeicao}</p>
                              )}
                              {summary.consumo_agua_sim && (
                                <p className="flex items-center gap-2">
                                  <Droplet size={14} className="text-blue-600" />
                                  <strong>Água:</strong> {summary.consumo_agua_sim}
                                </p>
                              )}
                              {summary.qualidade_sono_sim && (
                                <p className="flex items-center gap-2">
                                  <Moon size={14} className="text-purple-600" />
                                  <strong>Sono:</strong> {summary.qualidade_sono_sim}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              {summary.dia_nao_seguiu && (
                                <p><strong>Dias que não seguiu:</strong> {summary.dia_nao_seguiu}</p>
                              )}
                              {summary.refeicoes_fora_casa !== null && (
                                <p><strong>Refeições fora:</strong> {summary.refeicoes_fora_casa}</p>
                              )}
                              {summary.consumo_agua_nao && (
                                <p className="flex items-center gap-2">
                                  <Droplet size={14} className="text-blue-600" />
                                  <strong>Água:</strong> {summary.consumo_agua_nao}
                                </p>
                              )}
                              {summary.qualidade_sono_nao && (
                                <p className="flex items-center gap-2">
                                  <Moon size={14} className="text-purple-600" />
                                  <strong>Sono:</strong> {summary.qualidade_sono_nao}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Treino */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Dumbbell size={16} />
                          Sobre o Treino
                        </h5>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Faltou treino?</strong>{' '}
                            <span className={summary.faltou_treino ? 'text-red-600' : 'text-green-600'}>
                              {summary.faltou_treino ? 'SIM' : 'NÃO'}
                            </span>
                          </p>
                          {summary.faltou_treino && summary.quantos_dias_faltou && (
                            <p><strong>Dias que faltou:</strong> {summary.quantos_dias_faltou}</p>
                          )}
                          {summary.desempenho_treino && (
                            <p><strong>Desempenho:</strong> {summary.desempenho_treino}</p>
                          )}
                          {summary.horario_treino_proxima_semana && (
                            <p className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-600" />
                              <strong>Horário próxima semana:</strong> {summary.horario_treino_proxima_semana}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Fotos */}
                      {(summary.front_photo_url || summary.side_photo_url || summary.back_photo_url) && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <ImageIcon size={16} />
                            Fotos de Progresso
                          </h5>
                          <div className="grid grid-cols-3 gap-3">
                            {summary.front_photo_url && (
                              <div
                                className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                onClick={() => setSelectedPhoto(summary.front_photo_url!)}
                              >
                                <img
                                  src={summary.front_photo_url}
                                  alt="Frontal"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {summary.side_photo_url && (
                              <div
                                className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                onClick={() => setSelectedPhoto(summary.side_photo_url!)}
                              >
                                <img
                                  src={summary.side_photo_url}
                                  alt="Lateral"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {summary.back_photo_url && (
                              <div
                                className="aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                onClick={() => setSelectedPhoto(summary.back_photo_url!)}
                              >
                                <img
                                  src={summary.back_photo_url}
                                  alt="Costa"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Seu Feedback para {summary.aluno_name}
                        </label>
                        <textarea
                          value={feedbacks[summary.id] || summary.coach_feedback || ''}
                          onChange={(e) => setFeedbacks({ ...feedbacks, [summary.id]: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          placeholder="Escreva um feedback personalizado sobre o progresso do aluno..."
                          disabled={processing === summary.id}
                        />
                      </div>

                      {/* Botões */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSendFeedback(summary.id)}
                          disabled={processing === summary.id}
                          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send size={18} />
                          {processing === summary.id ? 'Enviando...' : 'Enviar Feedback'}
                        </button>
                        <button
                          onClick={() => handleMarkComplete(summary.id)}
                          disabled={processing === summary.id}
                          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Concluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concluídos */}
        {completedSummaries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Concluídos ({completedSummaries.length})
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {completedSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="relative group cursor-pointer"
                  onClick={() => setExpandedId(expandedId === summary.id ? null : summary.id)}
                >
                  {summary.aluno_photo ? (
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={summary.aluno_photo}
                        alt={summary.aluno_name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center grayscale">
                      <span className="text-4xl font-bold text-gray-400">
                        {summary.aluno_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex items-end p-2">
                    <div className="text-white text-xs">
                      <p className="font-semibold truncate">{summary.aluno_name}</p>
                      <p className="text-gray-300">{weekNames[summary.week_of_month - 1]} sem</p>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
