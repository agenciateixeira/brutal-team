'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressPhoto } from '@/types';
import { Camera, TrendingUp, Calendar, Upload } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface MonthlyPhotoProgressProps {
  alunoId: string;
}

export default function MonthlyPhotoProgress({ alunoId }: MonthlyPhotoProgressProps) {
  const [monthlyPhotos, setMonthlyPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  useEffect(() => {
    loadMonthlyPhotos();
  }, [alunoId]);

  const loadMonthlyPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .filter('aluno_id', 'eq', alunoId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMonthlyPhotos(data || []);
    } catch (error) {
      console.error('Erro ao carregar fotos do mês:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const targetPhotos = 4; // 4 fotos por mês (1 por semana)
    const currentPhotos = monthlyPhotos.length;
    return Math.min((currentPhotos / targetPhotos) * 100, 100);
  };

  const getCurrentWeekOfMonth = () => {
    const weekOfYear = getWeek(today);
    const weekOfMonthStart = getWeek(monthStart);
    return weekOfYear - weekOfMonthStart + 1;
  };

  const handleUploadClick = () => {
    router.push('/aluno/progresso');
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  const percentage = getProgressPercentage();
  const currentWeek = getCurrentWeekOfMonth();
  const photosThisWeek = monthlyPhotos.filter(photo => {
    const photoWeek = getWeek(new Date(photo.created_at));
    return photoWeek === getWeek(today) && getYear(new Date(photo.created_at)) === getYear(today);
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Camera size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Progresso Mensal
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-md text-sm font-medium"
        >
          <Upload size={16} />
          Upload
        </motion.button>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fotos do Mês
          </span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {monthlyPhotos.length}/4 ({Math.round(percentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Status da Semana */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Semana {currentWeek} de {format(monthEnd, 'MMMM', { locale: ptBR })}
            </span>
          </div>
          {photosThisWeek > 0 ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold">Foto enviada!</span>
            </div>
          ) : (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
              Envie sua foto desta semana
            </span>
          )}
        </div>
      </motion.div>

      {/* Grid de Fotos */}
      {monthlyPhotos.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {monthlyPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-300 dark:border-purple-700 group cursor-pointer shadow-md hover:shadow-xl transition-shadow"
              onClick={() => router.push('/aluno/progresso')}
            >
              <img
                src={photo.photo_url}
                alt={`Semana ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <span className="text-white text-xs font-bold">
                  Semana {index + 1}
                </span>
              </div>
            </motion.div>
          ))}
          {/* Slots vazios */}
          {Array.from({ length: 4 - monthlyPhotos.length }).map((_, index) => (
            <motion.div
              key={`empty-${index}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + (monthlyPhotos.length + index) * 0.1 }}
              className="relative aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all"
              onClick={handleUploadClick}
            >
              <Camera size={24} className="text-gray-400 dark:text-gray-500" />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all"
          onClick={handleUploadClick}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Camera size={48} className="mx-auto text-gray-400 mb-3" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Nenhuma foto enviada este mês
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            Clique para enviar sua primeira foto
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
