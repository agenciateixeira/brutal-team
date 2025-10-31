'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface CarbOption {
  id: string;
  carb_amount_g: number;
  food_name: string;
  portion_g: number | null;
  portion_text: string | null;
  type: string;
  notes: string | null;
  display_order: number;
}

interface NutritionGuideProps {
  carbOptions: CarbOption[];
}

export default function NutritionGuide({ carbOptions }: NutritionGuideProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(20);

  // Agrupar opções por quantidade de carboidratos
  const amounts = [20, 40, 60, 80, 100];

  const getOptionsForAmount = (amount: number) => {
    return carbOptions.filter(opt => opt.carb_amount_g === amount && opt.food_name !== 'OBSERVAÇÃO');
  };

  const getObservation = (amount: number) => {
    return carbOptions.find(opt => opt.carb_amount_g === amount && opt.food_name === 'OBSERVAÇÃO');
  };

  const renderOptions = (options: CarbOption[], type: string, title: string, icon: string) => {
    const filtered = options.filter(opt => opt.type === type);
    if (filtered.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        <div className="space-y-2">
          {filtered.map((option) => (
            <div
              key={option.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-normal">
                    {option.food_name}
                  </p>
                  {option.portion_text && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-light mt-1">
                      {option.portion_text}
                    </p>
                  )}
                </div>
                {option.portion_g && (
                  <div className="flex-shrink-0 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                      {option.portion_g}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de quantidade */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Selecione a quantidade de carboidratos
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {amounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedAmount === amount
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {amount}g
            </button>
          ))}
        </div>
      </div>

      {/* Opções para a quantidade selecionada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Opcoes para {selectedAmount}g de Carboidratos
        </h2>

        {(() => {
          const options = getOptionsForAmount(selectedAmount);
          const observation = getObservation(selectedAmount);

          return (
            <>
              {renderOptions(options, 'melhor', 'Melhores Opcoes', '🔹')}
              {renderOptions(options, 'secundaria', 'Opcoes Secundarias', '🔸')}
              {renderOptions(options, 'liquida', 'Opcoes Liquidas / Praticas', '💧')}

              {/* Observação */}
              {observation && observation.notes && (
                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Info className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Observacao Importante
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-200 font-light">
                        {observation.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nota geral */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-light">
                  <strong className="font-semibold">Importante:</strong> Todos os alimentos devem ser pesados ja cozidos, exceto quando indicado medida caseira (colher de sopa, etc).
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
