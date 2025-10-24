'use client';

import { ProgressPhoto } from '@/types';
import { TrendingUp } from 'lucide-react';

interface ProgressChartProps {
  photos: ProgressPhoto[];
}

export default function ProgressChart({ photos }: ProgressChartProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-primary-600" />
          Evolução Semanal
        </h2>
        <div className="text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            Ainda não há fotos de progresso. Comece a registrar sua evolução!
          </p>
        </div>
      </div>
    );
  }

  // Ordenar por semana
  const sortedPhotos = [...photos].sort((a, b) => a.week_number - b.week_number);
  const maxWeek = Math.max(...sortedPhotos.map(p => p.week_number));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={24} className="text-primary-600" />
        Evolução Semanal
      </h2>

      <div className="space-y-3">
        {sortedPhotos.map((photo) => {
          const percentage = (photo.week_number / maxWeek) * 100;

          return (
            <div key={photo.id} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">
                  Semana {photo.week_number}
                </span>
                <span className="text-gray-500">
                  {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {photo.notes && (
                <p className="text-xs text-gray-500 italic">
                  {photo.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-primary-50 rounded-lg">
        <p className="text-sm text-primary-700 font-medium">
          🎯 Continue assim! Você já está na semana {maxWeek} do seu progresso.
        </p>
      </div>
    </div>
  );
}
