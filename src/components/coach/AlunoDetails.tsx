'use client';

import { useState, useEffect } from 'react';
import { Profile, ProgressPhoto, Message, Dieta, Treino, ProtocoloHormonal, NotificationCounts } from '@/types';
import { ArrowLeft, Image as ImageIcon, MessageCircle, Apple, Dumbbell, Syringe, Calendar, FileText, X, Bell, User, Mail, Phone, CreditCard, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import CoachMessageList from './CoachMessageList';
import DietaManager from './DietaManager';
import TreinoManager from './TreinoManager';
import ProtocoloManager from './ProtocoloManager';
import AlunoStatistics from './AlunoStatistics';
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
  accessCode?: any;
  anamneseResponse?: any;
  firstAccessPhotos?: any;
}

type Tab = 'perfil' | 'fotos' | 'mensagens' | 'dieta' | 'treino' | 'protocolo';

export default function AlunoDetails({
  aluno,
  photos,
  messages,
  dietas,
  treinos,
  protocolos,
  coachId,
  accessCode,
  anamneseResponse,
  firstAccessPhotos
}: AlunoDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalData, setModalData] = useState<ProgressPhoto | null>(null);
  const [anamneseExpanded, setAnamneseExpanded] = useState(false);
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
    // Perfil não tem notificações
    if (tab === 'perfil') return;

    const typeMap: Record<Exclude<Tab, 'perfil'>, string> = {
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/coach/dashboard"
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
          </Link>
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 overflow-hidden">
            {aluno.avatar_url ? (
              <img
                src={aluno.avatar_url}
                alt={aluno.full_name || 'Avatar'}
                className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-full object-cover border-2 md:border-4 border-primary-500"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg md:text-2xl">
                {aluno.full_name?.[0]?.toUpperCase() || aluno.email[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h1 className="text-base md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {aluno.full_name || 'Nome não definido'}
              </h1>
              <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 truncate">{aluno.email}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1 hidden sm:block">
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
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'perfil'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <User size={20} />
            Perfil
          </button>
        </div>

        <div className="p-6">
          {/* Perfil Tab */}
          {activeTab === 'perfil' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Pessoais */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <User size={20} className="text-primary-600" />
                    Informações Pessoais
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome Completo</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={16} className="text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {aluno.full_name || 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail size={16} className="text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {aluno.email}
                        </p>
                      </div>
                    </div>

                    {aluno.phone_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone size={16} className="text-gray-400" />
                          <p className="text-gray-900 dark:text-white font-medium">
                            {aluno.phone_number}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente Desde</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="text-gray-900 dark:text-white font-medium">
                          {format(new Date(aluno.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {aluno.approved_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprovado em</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={16} className="text-gray-400" />
                          <p className="text-gray-900 dark:text-white font-medium">
                            {format(new Date(aluno.approved_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações de Pagamento */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-green-600" />
                    Informações de Pagamento
                  </h3>

                  <div className="space-y-3">
                    {aluno.monthly_fee && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mensalidade</label>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign size={16} className="text-gray-400" />
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            R$ {aluno.monthly_fee.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {aluno.payment_due_day && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dia de Vencimento</label>
                        <div className="flex items-center gap-2 mt-1">
                          <CreditCard size={16} className="text-gray-400" />
                          <p className="text-gray-900 dark:text-white font-medium">
                            Todo dia {aluno.payment_due_day}
                          </p>
                        </div>
                      </div>
                    )}

                    {aluno.last_payment_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Pagamento</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={16} className="text-gray-400" />
                          <p className="text-gray-900 dark:text-white font-medium">
                            {format(new Date(aluno.last_payment_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    {aluno.payment_status && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            aluno.payment_status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : aluno.payment_status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {aluno.payment_status === 'active' ? 'Ativo' :
                             aluno.payment_status === 'pending' ? 'Pendente' : 'Atrasado'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estatísticas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <ImageIcon size={24} className="mx-auto text-primary-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{photos.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Resumos Semanais</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <MessageCircle size={24} className="mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{messages.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Mensagens</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <Apple size={24} className="mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{dietas.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Dietas</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <Dumbbell size={24} className="mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{treinos.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Treinos</div>
                  </div>
                </div>
              </div>

              {/* Código de Primeiro Acesso */}
              {accessCode && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Código de Primeiro Acesso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Código</label>
                      <div className="mt-1 text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest">
                        {accessCode.code}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                          accessCode.is_used
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : accessCode.is_active
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                        }`}>
                          {accessCode.is_used ? 'Usado' : accessCode.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Plano</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">
                        {accessCode.plan_name || 'Não especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">
                        R$ {accessCode.plan_price ? Number(accessCode.plan_price).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Criação</label>
                      <p className="text-gray-900 dark:text-white font-medium mt-1">
                        {accessCode.created_at ? format(new Date(accessCode.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                      </p>
                    </div>
                    {accessCode.used_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Uso</label>
                        <p className="text-gray-900 dark:text-white font-medium mt-1">
                          {format(new Date(accessCode.used_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fotos de Primeiro Acesso */}
              {firstAccessPhotos && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-600" />
                    Fotos de Primeiro Acesso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {firstAccessPhotos.front_photo_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Frontal</p>
                        <div className="relative aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Image
                            src={firstAccessPhotos.front_photo_url}
                            alt="Foto frontal"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {firstAccessPhotos.side_photo_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lateral</p>
                        <div className="relative aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Image
                            src={firstAccessPhotos.side_photo_url}
                            alt="Foto lateral"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {firstAccessPhotos.back_photo_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Costas</p>
                        <div className="relative aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <Image
                            src={firstAccessPhotos.back_photo_url}
                            alt="Foto de costas"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Enviado em: {firstAccessPhotos.uploaded_at ? format(new Date(firstAccessPhotos.uploaded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                  </p>
                </div>
              )}

              {/* Estatísticas de Adesão do Aluno */}
              <AlunoStatistics alunoId={aluno.id} />
            </div>
          )}

          {/* Resumo Semanal Tab */}
          {activeTab === 'fotos' && (
            <div className="space-y-6">
              {/* Questionário de Anamnese */}
              {anamneseResponse && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-6 border-2 border-green-200 dark:border-green-800">
                  <button
                    onClick={() => setAnamneseExpanded(!anamneseExpanded)}
                    className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText size={20} className="text-green-600" />
                      Questionário de Anamnese
                    </h3>
                    {anamneseExpanded ? (
                      <ChevronUp size={24} className="text-green-600" />
                    ) : (
                      <ChevronDown size={24} className="text-green-600" />
                    )}
                  </button>

                  {anamneseExpanded && (
                    <div className="space-y-4">
                    {/* Informações Básicas */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Informações Básicas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Idade:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.idade} anos</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Altura:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.altura} cm</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Peso:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.peso} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">IMC:</span>
                          <span className="text-gray-900 dark:text-white ml-2">
                            {(anamneseResponse.peso / Math.pow(anamneseResponse.altura / 100, 2)).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Medidas */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Medidas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Cintura:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.cintura} cm</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Braço:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.braco} cm</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Perna:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.perna} cm</span>
                        </div>
                      </div>
                    </div>

                    {/* Rotina */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rotina</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Profissão:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.profissao}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Rotina de Trabalho:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.rotina_trabalho}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Estuda:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.estuda ? 'Sim' : 'Não'}</span>
                          {anamneseResponse.estuda && anamneseResponse.horarios_estudo && (
                            <p className="text-gray-900 dark:text-white mt-1">Horários: {anamneseResponse.horarios_estudo}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Atividade Física */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Atividade Física</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Pratica atividade física:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.pratica_atividade_fisica ? 'Sim' : 'Não'}</span>
                        </div>
                        {anamneseResponse.pratica_atividade_fisica && (
                          <>
                            {anamneseResponse.modalidades_exercicio && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Modalidades:</span>
                                <p className="text-gray-900 dark:text-white">{anamneseResponse.modalidades_exercicio}</p>
                              </div>
                            )}
                            {anamneseResponse.dias_horarios_atividade && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Dias e horários:</span>
                                <p className="text-gray-900 dark:text-white">{anamneseResponse.dias_horarios_atividade}</p>
                              </div>
                            )}
                          </>
                        )}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Horários de sono:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.horarios_sono}</p>
                        </div>
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Objetivos</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Trajetória e objetivos:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.trajetoria_objetivos}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Mudanças esperadas:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.mudancas_esperadas}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Resultado estético final:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.resultado_estetico_final}</p>
                        </div>
                      </div>
                    </div>

                    {/* Histórico de Treino */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Histórico de Treino</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Tempo de treino contínuo:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.tempo_treino_continuo}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Resultados estagnados:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.resultados_estagnados ? 'Sim' : 'Não'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Percepção de pump:</span>
                          <p className="text-gray-900 dark:text-white">{anamneseResponse.percepcao_pump}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Uso de esteroides:</span>
                          <span className="text-gray-900 dark:text-white ml-2">{anamneseResponse.uso_esteroides ? 'Sim' : 'Não'}</span>
                          {anamneseResponse.uso_esteroides && anamneseResponse.quais_esteroides && (
                            <p className="text-gray-900 dark:text-white mt-1">Quais: {anamneseResponse.quais_esteroides}</p>
                          )}
                        </div>
                        {anamneseResponse.outras_substancias && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Outras substâncias:</span>
                            <p className="text-gray-900 dark:text-white">{anamneseResponse.outras_substancias}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      Respondido em: {anamneseResponse.completed_at ? format(new Date(anamneseResponse.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  )}
                </div>
              )}

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
            <DietaManager alunoId={aluno.id} dietas={dietas} coachId={coachId} />
          )}

          {/* Treino Tab */}
          {activeTab === 'treino' && (
            <TreinoManager alunoId={aluno.id} treinos={treinos} coachId={coachId} />
          )}

          {/* Protocolo Tab */}
          {activeTab === 'protocolo' && (
            <ProtocoloManager alunoId={aluno.id} protocolos={protocolos} coachId={coachId} />
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
