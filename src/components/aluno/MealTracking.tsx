'use client';

import { Apple, Camera } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface MealPhoto {
  id: string;
  photo_url: string;
  meal_type: string;
  created_at: string;
}

interface MealTrackingProps {
  alunoId: string;
  meals: MealPhoto[];
  completionPercentage: number;
}

export default function MealTracking({ alunoId, meals, completionPercentage }: MealTrackingProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealPhoto | null>(null);

  // Calcular refeições dos últimos 7 dias
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const mealsByDay = last7Days.map(date => {
    const dayMeals = meals.filter(meal =>
      meal.created_at.split('T')[0] === date
    );
    return {
      date,
      count: dayMeals.length
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Apple size={24} className="text-green-600" />
          Acompanhamento de Dieta
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Compliance Mensal
          </span>
          <span className="text-2xl font-bold text-green-600">
            {completionPercentage}%
          </span>
        </div>
        <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {meals.length} refeições registradas este mês
        </p>
      </div>

      {/* Últimos 7 dias */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Últimos 7 dias
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {mealsByDay.map(({ date, count }) => {
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
            const dayNumber = new Date(date + 'T00:00:00').getDate();

            return (
              <div key={date} className="text-center">
                <div className="text-xs text-gray-500 mb-1 capitalize">
                  {dayName}
                </div>
                <div
                  className={`
                    w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold
                    ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}
                  `}
                >
                  <span className="text-lg">{dayNumber}</span>
                  <span className="text-[10px]">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Galeria de Fotos Recentes */}
      {meals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Refeições Recentes
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {meals.slice(0, 16).map((meal) => (
              <div
                key={meal.id}
                className="aspect-square relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                onClick={() => setSelectedMeal(meal)}
              >
                <Image
                  src={meal.photo_url}
                  alt={meal.meal_type}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {meals.length === 0 && (
        <div className="text-center py-8">
          <Camera size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            Nenhuma refeição registrada ainda.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Vá na aba Dieta para começar a registrar suas refeições!
          </p>
        </div>
      )}

      {/* Modal */}
      {selectedMeal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMeal(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square mb-4">
              <Image
                src={selectedMeal.photo_url}
                alt={selectedMeal.meal_type}
                fill
                className="object-contain"
              />
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-900">{selectedMeal.meal_type}</p>
              <p className="text-sm text-gray-500">
                {new Date(selectedMeal.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
