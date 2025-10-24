'use client';

import { useState } from 'react';
import { Profile, ProgressPhoto, Message, Dieta, Treino } from '@/types';
import { ArrowLeft, Image as ImageIcon, MessageCircle, Apple, Dumbbell, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CoachMessageList from './CoachMessageList';
import DietaManager from './DietaManager';
import TreinoManager from './TreinoManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoDetailsProps {
  aluno: Profile;
  photos: ProgressPhoto[];
  messages: Message[];
  dietas: Dieta[];
  treinos: Treino[];
  coachId: string;
}

type Tab = 'fotos' | 'mensagens' | 'dieta' | 'treino';

export default function AlunoDetails({
  aluno,
  photos,
  messages,
  dietas,
  treinos,
  coachId
}: AlunoDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {aluno.full_name || 'Nome não definido'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{aluno.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
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
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'fotos'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ImageIcon size={20} />
            Fotos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('mensagens')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'mensagens'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle size={20} />
            Mensagens ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('dieta')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'dieta'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Apple size={20} />
            Dieta ({dietas.length})
          </button>
          <button
            onClick={() => setActiveTab('treino')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'treino'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Dumbbell size={20} />
            Treino ({treinos.length})
          </button>
        </div>

        <div className="p-6">
          {/* Fotos Tab */}
          {activeTab === 'fotos' && (
            <div>
              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma foto enviada ainda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={photo.photo_url}
                          alt={`Semana ${photo.week_number}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center gap-2 text-white">
                          <Calendar size={14} />
                          <span className="text-sm font-semibold">Semana {photo.week_number}</span>
                        </div>
                        {photo.notes && (
                          <p className="text-xs text-gray-300 mt-1 line-clamp-2">{photo.notes}</p>
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
        </div>
      </div>

      {/* Modal de Visualização de Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square mb-4">
              <Image
                src={selectedPhoto.photo_url}
                alt={`Semana ${selectedPhoto.week_number}`}
                fill
                className="object-contain"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar size={18} />
                  <span className="font-semibold">Semana {selectedPhoto.week_number}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(selectedPhoto.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>

              {selectedPhoto.notes && (
                <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <FileText size={18} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{selectedPhoto.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
