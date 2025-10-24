'use client';

import { Dieta, Treino } from '@/types';
import { Apple, Dumbbell } from 'lucide-react';

interface DietaTreinoProps {
  dieta: Dieta | null;
  treino: Treino | null;
}

export default function DietaTreino({ dieta, treino }: DietaTreinoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Dieta */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Apple size={24} className="text-green-500" />
          Dieta Atual
        </h2>

        {dieta ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{dieta.title}</h3>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-gray-900 p-4 rounded-lg">
                {dieta.content}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Nenhuma dieta ativa no momento
          </p>
        )}
      </div>

      {/* Treino */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Dumbbell size={24} className="text-red-500" />
          Treino Atual
        </h2>

        {treino ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{treino.title}</h3>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-gray-900 p-4 rounded-lg">
                {treino.content}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Nenhum treino ativo no momento
          </p>
        )}
      </div>
    </div>
  );
}
