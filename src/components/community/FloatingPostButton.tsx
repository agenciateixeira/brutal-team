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

      // 4. Criar check-in automático (data de hoje)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error: checkInError } = await supabase
        .from('community_check_ins')
        .insert({
          aluno_id: alunoId,
          check_in_date: today,
        });

      if (checkInError) {
        // Se já tem check-in hoje, ignora o erro (é esperado)
        console.log('ℹ️ Check-in já existe hoje ou erro ao criar:', checkInError);
      }

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
      console.error('❌ ERRO DETALHADO AO POSTAR FOTO:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusCode: error?.statusCode,
        fullError: error
      });
      setToast({ type: 'error', message: `Erro ao postar: ${error?.message || 'Tente novamente!'}` });
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

      // Criar check-in automático (data de hoje)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const { error: checkInError } = await supabase
        .from('community_check_ins')
        .insert({
          aluno_id: alunoId,
          check_in_date: today,
        });

      if (checkInError) {
        // Se já tem check-in hoje, ignora o erro (é esperado)
        console.log('ℹ️ Check-in já existe hoje ou erro ao criar:', checkInError);
      }

      // Sucesso!
      setToast({ type: 'success', message: '✅ Post publicado! Check-in marcado!' });

      // Resetar form
      setModalType(null);
      setTextPost('');

      // Callback para recarregar feed
      onPostCreated?.();

    } catch (error: any) {
      console.error('❌ ERRO DETALHADO AO POSTAR TEXTO:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusCode: error?.statusCode,
        fullError: error
      });
      setToast({ type: 'error', message: `Erro ao postar: ${error?.message || 'Tente novamente!'}` });
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

            {/* Modal - PERFEITAMENTE CENTRALIZADO */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm md:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-blue-600 text-white p-3 flex items-center justify-between rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Camera size={20} />
                    <h2 className="text-base font-bold">Postar Treino</h2>
                  </div>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Preview ou upload */}
                {preview ? (
                  <div className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900" style={{ aspectRatio: '1' }}>
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
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-xs mx-auto h-36 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-full group-hover:scale-110 transition-transform">
                      <ImageIcon className="text-primary-600" size={24} />
                    </div>
                    <div className="text-center px-3">
                      <p className="text-gray-900 dark:text-white font-semibold text-xs mb-0.5">
                        Clique para selecionar
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Máximo 5MB
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
                  <label className="block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Legenda (opcional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ex: Treino de pernas completo! 💪"
                    maxLength={200}
                    rows={2}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 text-right">
                    {caption.length}/200
                  </p>
                </div>
              </div>

              {/* Footer - Fixo */}
              <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 safe-area-inset-bottom">
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePhotoSubmit}
                  disabled={!selectedFile || uploading}
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Postando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Postar
                    </>
                  )}
                </button>
              </div>
              </motion.div>
            </div>
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

            {/* Modal - PERFEITAMENTE CENTRALIZADO */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm md:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-primary-600 to-blue-600 text-white p-3 flex items-center justify-between rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={20} />
                    <h2 className="text-base font-bold">Postar Mensagem</h2>
                  </div>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Textarea */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    O que você está pensando?
                  </label>
                  <textarea
                    value={textPost}
                    onChange={(e) => setTextPost(e.target.value)}
                    placeholder="Ex: Mais um dia de treino completo! 💪 Sentindo a evolução..."
                    maxLength={500}
                    rows={12}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 text-right">
                    {textPost.length}/500
                  </p>
                </div>
              </div>

              {/* Footer - Fixo */}
              <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 safe-area-inset-bottom">
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textPost.trim() || uploading}
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-xs text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Postando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Publicar
                    </>
                  )}
                </button>
              </div>
              </motion.div>
            </div>
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
