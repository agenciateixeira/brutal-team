'use client';

import { useState, useEffect } from 'react';
import { Profile, ProgressPhoto, Message, Dieta, Treino, ProtocoloHormonal, NotificationCounts } from '@/types';
import { ArrowLeft, Image as ImageIcon, MessageCircle, Apple, Dumbbell, Syringe, Calendar, FileText, X, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import CoachMessageList from './CoachMessageList';
import DietaManager from './DietaManager';
import TreinoManager from './TreinoManager';
import ProtocoloManager from './ProtocoloManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoDetailsProps {
  aluno: Profile;
  photos: ProgressPhoto[];
  messages: Message[];
  dietas: Dieta[];
  treinos: Treino[];
  protocolos: ProtocoloHormonal[];
  coachId: string;
}

type Tab = 'fotos' | 'mensagens' | 'dieta' | 'treino' | 'protocolo';

export default function AlunoDetails({
  aluno,
  photos,
  messages,
  dietas,
  treinos,
  protocolos,
  coachId
}: AlunoDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalData, setModalData] = useState<ProgressPhoto | null>(null);
  const [notifications, setNotifications] = useState<NotificationCounts>({
    photo: 0,
    message: 0,
    diet: 0,
    workout: 0,
    protocol: 0,
    total: 0
  });

  const supabase = createClient();

  // Carregar notificações não visualizadas
  useEffect(() => {
    loadNotifications();
  }, [aluno.id, coachId]);

  // Marcar como visualizado ao trocar de tab
  useEffect(() => {
    handleTabView(activeTab);
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_notifications')
        .select('notification_type')
        .eq('coach_id', coachId)
        .eq('aluno_id', aluno.id)
        .eq('is_viewed', false);

      if (error) throw error;

      const counts: NotificationCounts = {
        photo: 0,
        message: 0,
        diet: 0,
        workout: 0,
        protocol: 0,
        total: data?.length || 0
      };

      data?.forEach((notif) => {
        counts[notif.notification_type as keyof NotificationCounts]++;
      });

      setNotifications(counts);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleTabView = async (tab: Tab) => {
    const typeMap: Record<Tab, string> = {
      fotos: 'photo',
      mensagens: 'message',
      dieta: 'diet',
      treino: 'workout',
      protocolo: 'protocol'
    };

    const notificationType = typeMap[tab];

    try {
      const { error } = await supabase.rpc('mark_notifications_as_viewed', {
        p_coach_id: coachId,
        p_aluno_id: aluno.id,
        p_notification_type: notificationType
      });

      if (error) throw error;

      // Atualizar contadores localmente
      setNotifications(prev => ({
        ...prev,
        [notificationType]: 0,
        total: Math.max(0, prev.total - prev[notificationType as keyof NotificationCounts])
      }));
    } catch (error) {
      console.error('Erro ao marcar notificações como vistas:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/coach/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
          </Link>
          <div className="flex items-center gap-4 flex-1">
            {aluno.avatar_url ? (
              <img
                src={aluno.avatar_url}
                alt={aluno.full_name || 'Avatar'}
                className="w-16 h-16 rounded-full object-cover border-4 border-primary-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
                {aluno.full_name?.[0]?.toUpperCase() || aluno.email[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {aluno.full_name || 'Nome não definido'}
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">{aluno.email}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1">
                Cliente desde {format(new Date(aluno.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('fotos')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'fotos'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ImageIcon size={20} />
            Resumo Semanal ({photos.length})
            {notifications.photo > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {notifications.photo}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('mensagens')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'mensagens'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle size={20} />
            Mensagens ({messages.length})
            {notifications.message > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                {notifications.message}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('dieta')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'dieta'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Apple size={20} />
            Dieta ({dietas.length})
            {notifications.diet > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                {notifications.diet}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('treino')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'treino'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Dumbbell size={20} />
            Treino ({treinos.length})
            {notifications.workout > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">
                {notifications.workout}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('protocolo')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap relative ${
              activeTab === 'protocolo'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Syringe size={20} />
            Protocolo ({protocolos.length})
            {notifications.protocol > 0 && (
              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white text-xs font-bold">
                {notifications.protocol}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Resumo Semanal Tab */}
          {activeTab === 'fotos' && (
            <div>
              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum resumo semanal enviado ainda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary-600" />
                            <span className="font-semibold text-gray-900 dark:text-white">Semana {photo.week_number}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(photo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Medidas */}
                        {(photo.peso || photo.cintura || photo.biceps_contraido || photo.pernas || photo.panturrilha) && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Medidas Corporais</h4>
                              <button
                                onClick={() => {
                                  setModalData(photo);
                                  setShowMeasurementsModal(true);
                                }}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              >
                                Ver detalhes
                              </button>
                            </div>
                            <div className="space-y-2 text-sm">
                              {photo.peso && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  <span className="text-gray-500 dark:text-gray-400">Peso:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{photo.peso} kg</span>
                                </div>
                              )}
                              {photo.cintura && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  <span className="text-gray-500 dark:text-gray-400">Cintura:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{photo.cintura} cm</span>
                                </div>
                              )}
                              {photo.biceps_contraido && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  <span className="text-gray-500 dark:text-gray-400">Bíceps:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{photo.biceps_contraido} cm</span>
                                </div>
                              )}
                              {photo.pernas && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                  <span className="text-gray-500 dark:text-gray-400">Pernas:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">{photo.pernas} cm</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Foto */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Foto de Progresso</h4>
                            <button
                              onClick={() => {
                                setModalData(photo);
                                setShowPhotoModal(true);
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Ampliar
                            </button>
                          </div>
                          <div
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setModalData(photo);
                              setShowPhotoModal(true);
                            }}
                          >
                            <Image
                              src={photo.photo_url}
                              alt={`Semana ${photo.week_number}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>

                        {/* Observações */}
                        {photo.notes && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex gap-2">
                              <FileText size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-gray-700 dark:text-gray-300">{photo.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mensagens Tab */}
          {activeTab === 'mensagens' && (
            <CoachMessageList
              alunoId={aluno.id}
              coachId={coachId}
              messages={messages}
            />
          )}

          {/* Dieta Tab */}
          {activeTab === 'dieta' && (
            <DietaManager alunoId={aluno.id} dietas={dietas} />
          )}

          {/* Treino Tab */}
          {activeTab === 'treino' && (
            <TreinoManager alunoId={aluno.id} treinos={treinos} />
          )}

          {/* Protocolo Tab */}
          {activeTab === 'protocolo' && (
            <ProtocoloManager alunoId={aluno.id} protocolos={protocolos} />
          )}
        </div>
      </div>

      {/* Modal de Medidas */}
      {showMeasurementsModal && modalData && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMeasurementsModal(false);
            setModalData(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-primary-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Medidas Corporais - Semana {modalData.week_number}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowMeasurementsModal(false);
                  setModalData(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {format(new Date(modalData.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalData.peso && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peso</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{modalData.peso} kg</div>
                </div>
              )}
              {modalData.cintura && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cintura</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{modalData.cintura} cm</div>
                </div>
              )}
              {modalData.biceps_contraido && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bíceps Contraído</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{modalData.biceps_contraido} cm</div>
                </div>
              )}
              {modalData.pernas && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pernas</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{modalData.pernas} cm</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 palmo acima do joelho</div>
                </div>
              )}
              {modalData.panturrilha && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Panturrilha</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{modalData.panturrilha} cm</div>
                </div>
              )}
            </div>

            {modalData.notes && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex gap-2">
                  <FileText size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Observações</div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{modalData.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Foto */}
      {showPhotoModal && modalData && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowPhotoModal(false);
            setModalData(null);
          }}
        >
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-white">
                <Calendar size={20} />
                <span className="font-semibold">Semana {modalData.week_number}</span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-300">
                  {format(new Date(modalData.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setModalData(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <Image
                src={modalData.photo_url}
                alt={`Semana ${modalData.week_number}`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
