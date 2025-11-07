'use client';

import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2, Image as ImageIcon, Plus, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';
import Image from 'next/image';

interface FloatingPostButtonProps {
  alunoId: string;
  onPostCreated?: () => void;
}

type ModalType = 'menu' | 'photo' | 'text' | null;

export default function FloatingPostButton({ alunoId, onPostCreated }: FloatingPostButtonProps) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [textPost, setTextPost] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Por favor, selecione uma imagem' });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Imagem muito grande! Máximo 5MB' });
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSubmit = async () => {
    if (!selectedFile) {
      setToast({ type: 'error', message: 'Selecione uma foto do treino!' });
      return;
    }

    try {
      setUploading(true);

      // 1. Upload da foto no Storage
      const fileName = `${alunoId}/${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // 3. Criar post na comunidade
      const { error: postError } = await supabase
        .from('community_posts')
        .insert({
          aluno_id: alunoId,
          photo_url: publicUrl,
          caption: caption.trim() || null,
          workout_type: 'treino',
        });

      if (postError) throw postError;

      // Sucesso!
      setToast({ type: 'success', message: '🔥 Treino postado! Check-in marcado!' });

      // Resetar form
      setModalType(null);
      setPreview(null);
      setCaption('');
      setSelectedFile(null);

      // Callback para recarregar feed
      onPostCreated?.();

    } catch (error: any) {
      console.error('Erro ao postar:', error);
      setToast({ type: 'error', message: 'Erro ao postar. Tente novamente!' });
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textPost.trim()) {
      setToast({ type: 'error', message: 'Escreva algo para postar!' });
      return;
    }

    try {
      setUploading(true);

      // Criar post apenas com texto
      const { error: postError } = await supabase
        .from('community_posts')
        .insert({
          aluno_id: alunoId,
          photo_url: null,
          caption: textPost.trim(),
          workout_type: 'update',
        });

      if (postError) throw postError;

      // Sucesso!
      setToast({ type: 'success', message: '✅ Post publicado!' });

      // Resetar form
      setModalType(null);
      setTextPost('');

      // Callback para recarregar feed
      onPostCreated?.();

    } catch (error: any) {
      console.error('Erro ao postar:', error);
      setToast({ type: 'error', message: 'Erro ao postar. Tente novamente!' });
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    if (!uploading) {
      setModalType(null);
      setPreview(null);
      setCaption('');
      setTextPost('');
      setSelectedFile(null);
    }
  };

  return (
    <>
      {/* Botão Flutuante + */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalType('menu')}
        className="fixed bottom-24 md:bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform" strokeWidth={3} />
      </motion.button>

      {/* Menu de Opções */}
      <AnimatePresence>
        {modalType === 'menu' && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Menu Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-28 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 right-6 md:right-auto z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-72 md:w-80"
            >
              <div className="p-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white">
                <h2 className="text-lg font-bold">O que você quer fazer?</h2>
              </div>

              <div className="p-2">
                <button
                  onClick={() => setModalType('photo')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:scale-110 transition-transform">
                    <Camera className="text-blue-600" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Postar Foto de Treino</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Compartilhe seu progresso</p>
                  </div>
                </button>

                <button
                  onClick={() => setModalType('text')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full group-hover:scale-110 transition-transform">
                    <MessageSquare className="text-green-600" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Postar Mensagem</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Escreva uma atualização</p>
                  </div>
                </button>

                <a
                  href="/aluno/indicacao"
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full group-hover:scale-110 transition-transform">
                    <UserPlus className="text-purple-600" size={24} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">Convidar Amigo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Compartilhe seu código</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </>
        )}

        {/* Modal de Foto */}
        {modalType === 'photo' && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal - MOBILE: fullscreen fixo, DESKTOP: centralizado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl flex flex-col md:max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={24} />
                  <h2 className="text-lg font-bold">Postar Treino</h2>
                </div>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Preview ou upload */}
                {preview ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="p-4 bg-primary-100 dark:bg-primary-900/50 rounded-full group-hover:scale-110 transition-transform">
                      <ImageIcon className="text-primary-600" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-gray-900 dark:text-white font-semibold mb-1">
                        Clique para selecionar a foto
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Máximo 5MB • JPG, PNG
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Legenda */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Legenda (opcional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ex: Treino de pernas completo! 💪"
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {caption.length}/200
                  </p>
                </div>

                {/* Info */}
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>✨ Ao postar:</strong> Seu check-in do dia será marcado automaticamente e você aparecerá no feed da comunidade!
                  </p>
                </div>
              </div>

              {/* Footer - Fixo */}
              <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePhotoSubmit}
                  disabled={!selectedFile || uploading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Postando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Postar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Modal de Texto */}
        {modalType === 'text' && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal - MOBILE: fullscreen fixo, DESKTOP: centralizado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl flex flex-col md:max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={24} />
                  <h2 className="text-lg font-bold">Postar Mensagem</h2>
                </div>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    O que você está pensando?
                  </label>
                  <textarea
                    value={textPost}
                    onChange={(e) => setTextPost(e.target.value)}
                    placeholder="Ex: Mais um dia de treino completo! 💪 Sentindo a evolução..."
                    maxLength={500}
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {textPost.length}/500
                  </p>
                </div>

                {/* Info */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>💬 Dica:</strong> Compartilhe suas conquistas, motivação ou progresso com sua comunidade!
                  </p>
                </div>
              </div>

              {/* Footer - Fixo */}
              <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textPost.trim() || uploading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Postando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
