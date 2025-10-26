'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressPhoto } from '@/types';
import { Camera, TrendingUp, Calendar, Upload } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage === 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-yellow-600';
    if (percentage >= 50) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getProgressTextColor = () => {
    const percentage = getProgressPercentage();
    if (percentage === 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCurrentWeekOfMonth = () => {
    const weekOfYear = getWeek(today);
    const weekOfMonthStart = getWeek(monthStart);
    return weekOfYear - weekOfMonthStart + 1;
  };

  const handleUploadClick = () => {
    router.push('/aluno/fotos');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const percentage = getProgressPercentage();
  const currentWeek = getCurrentWeekOfMonth();
  const photosThisWeek = monthlyPhotos.filter(photo => {
    const photoWeek = getWeek(new Date(photo.created_at));
    return photoWeek === getWeek(today) && getYear(new Date(photo.created_at)) === getYear(today);
  }).length;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera size={24} className="text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progresso Mensal
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Fotos do Mês
          </span>
          <span className={`text-sm font-semibold ${getProgressTextColor()}`}>
            {monthlyPhotos.length}/4 ({Math.round(percentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Status da Semana */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
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
      </div>

      {/* Grid de Fotos */}
      {monthlyPhotos.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {monthlyPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary-200 dark:border-primary-700 group cursor-pointer"
              onClick={() => router.push('/aluno/fotos')}
            >
              <img
                src={photo.photo_url}
                alt={`Semana ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-semibold">
                  Semana {index + 1}
                </span>
              </div>
            </div>
          ))}
          {/* Slots vazios */}
          {Array.from({ length: 4 - monthlyPhotos.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="relative aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
              onClick={handleUploadClick}
            >
              <Camera size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
          onClick={handleUploadClick}
        >
          <Camera size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Nenhuma foto enviada este mês
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            Clique para enviar sua primeira foto
          </p>
        </div>
      )}
    </div>
  );
}
