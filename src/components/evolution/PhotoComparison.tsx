'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Calendar, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  created_at: string;
}

interface PhotoComparisonProps {
  alunoId: string;
}

export default function PhotoComparison({ alunoId }: PhotoComparisonProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [beforePhoto, setBeforePhoto] = useState<ProgressPhoto | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<ProgressPhoto | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadPhotos();

    // Real-time subscription
    const channel = supabase
      .channel(`photo-comparison-${alunoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'progress_photos',
        filter: `aluno_id=eq.${alunoId}`,
      }, (payload) => {
        console.log('Photos data changed:', payload);
        // Reload data after a short delay to ensure DB is updated
        setTimeout(loadPhotos, 300);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alunoId]);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPhotos(data);
        setBeforePhoto(data[0]); // Primeira foto
        setAfterPhoto(data[data.length - 1]); // Última foto
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const selectPhoto = (photo: ProgressPhoto, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhoto(photo);
    } else {
      setAfterPhoto(photo);
    }
  };

  const navigatePhoto = (direction: 'prev' | 'next', type: 'before' | 'after') => {
    const currentPhoto = type === 'before' ? beforePhoto : afterPhoto;
    if (!currentPhoto) return;

    const currentIndex = photos.findIndex(p => p.id === currentPhoto.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < photos.length) {
      selectPhoto(photos[newIndex], type);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (photos.length < 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <Camera size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Você precisa de pelo menos 2 fotos
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Envie mais fotos de progresso para comparar sua evolução
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Camera size={24} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Comparador de Fotos
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {photos.length} fotos de progresso
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFullscreen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Maximize2 size={20} className="text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>

        {/* Comparison Slider */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] md:aspect-video rounded-lg overflow-hidden cursor-ew-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* Foto Antes (Background) */}
          {beforePhoto && (
            <img
              src={beforePhoto.photo_url}
              alt="Antes"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          )}

          {/* Foto Depois (Overlay com clip-path) */}
          {afterPhoto && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={afterPhoto.photo_url}
                alt="Depois"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Slider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
                <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-white text-xs font-semibold">ANTES</p>
            {beforePhoto && (
              <p className="text-white/80 text-[10px]">
                {format(new Date(beforePhoto.created_at), 'dd MMM yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-white text-xs font-semibold">DEPOIS</p>
            {afterPhoto && (
              <p className="text-white/80 text-[10px]">
                {format(new Date(afterPhoto.created_at), 'dd MMM yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        {/* Photo Selectors */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Selector Antes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Antes</p>
              <div className="flex gap-1">
                <button
                  onClick={() => navigatePhoto('prev', 'before')}
                  disabled={!beforePhoto || photos[0].id === beforePhoto.id}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => navigatePhoto('next', 'before')}
                  disabled={!beforePhoto || photos[photos.length - 1].id === beforePhoto.id}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {photos.map(photo => (
                <motion.button
                  key={photo.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectPhoto(photo, 'before')}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden
                    ${beforePhoto?.id === photo.id ? 'ring-2 ring-blue-600' : ''}
                  `}
                >
                  <img
                    src={photo.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Selector Depois */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Depois</p>
              <div className="flex gap-1">
                <button
                  onClick={() => navigatePhoto('prev', 'after')}
                  disabled={!afterPhoto || photos[0].id === afterPhoto.id}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => navigatePhoto('next', 'after')}
                  disabled={!afterPhoto || photos[photos.length - 1].id === afterPhoto.id}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {photos.map(photo => (
                <motion.button
                  key={photo.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectPhoto(photo, 'after')}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden
                    ${afterPhoto?.id === photo.id ? 'ring-2 ring-pink-600' : ''}
                  `}
                >
                  <img
                    src={photo.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && beforePhoto && afterPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={beforePhoto.photo_url}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={afterPhoto.photo_url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              </div>
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-1 h-6 bg-gray-400 rounded"></div>
                    <div className="w-1 h-6 bg-gray-400 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
