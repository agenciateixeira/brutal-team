'use client';

import { useEffect, useState } from 'react';
import { X, ChefHat, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FoodOption {
  id: string;
  food_name: string;
  portion_g: number | null;
  type: string;
  notes: string | null;
}

interface FoodOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutrientType: 'carboidrato' | 'proteina';
  amount: number;
}

export default function FoodOptionsModal({ isOpen, onClose, nutrientType, amount }: FoodOptionsModalProps) {
  const [options, setOptions] = useState<FoodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, nutrientType, amount]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      if (nutrientType === 'carboidrato') {
        const { data, error } = await supabase
          .from('carb_food_options')
          .select('*')
          .eq('carb_amount_g', amount)
          .neq('food_name', 'OBSERVAÇÃO')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setOptions(data || []);
      } else {
        // Proteína ainda não tem dados
        setOptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar opcoes:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderOptions = (type: string, title: string, icon: string) => {
    const filtered = options.filter(opt => opt.type === type);
    if (filtered.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h4>
        <div className="space-y-2">
          {filtered.map((option) => (
            <div
              key={option.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white font-normal">
                    {option.food_name}
                  </p>
                </div>
                {option.portion_g && (
                  <div className="flex-shrink-0 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded">
                    <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
          <div className="flex items-center gap-3">
            <ChefHat className="text-primary-600 dark:text-primary-400" size={24} />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Opcoes de Alimentos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {amount}g de {nutrientType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={32} />
            </div>
          ) : nutrientType === 'proteina' ? (
            // Mensagem divertida para proteína
            <div className="text-center py-12">
              <ChefHat className="mx-auto text-primary-400 mb-4" size={64} />
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Estamos construindo seu guia de alimento perfeito!
              </h4>
              <p className="text-gray-600 dark:text-gray-400 font-light">
                Em breve voce tera todas as opcoes de proteinas disponiveis aqui.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 font-light mt-4">
                Enquanto isso, consulte seu coach para as melhores opcoes de proteinas.
              </p>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma opcao encontrada para esta quantidade.
              </p>
            </div>
          ) : (
            <>
              {renderOptions('melhor', 'Melhores Opcoes', '🔹')}
              {renderOptions('secundaria', 'Opcoes Secundarias', '🔸')}
              {renderOptions('liquida', 'Opcoes Liquidas / Praticas', '💧')}

              {/* Nota */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-light">
                  <strong className="font-semibold">Importante:</strong> Todos os alimentos devem ser pesados ja cozidos, exceto quando indicado medida caseira.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
