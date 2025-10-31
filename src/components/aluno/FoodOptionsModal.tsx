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
  nutrientType: 'carboidrato' | 'proteina' | 'gordura';
  amount: number;
}

// Dados hardcoded de proteínas (movidos para fora do componente)
const proteinData: Record<number, { options: string[]; liquidas: string[]; notes: string[] }> = {
    20: {
      options: [
        '75g de carne magra pronta (grelhada ou cozida) - equivalente a 100g crua',
        '5 claras de ovos / 300ml de clara pasteurizada',
        '40g de carne magra pronta + 3 claras de ovos - equivalente a 50g de carne crua + 3 claras'
      ],
      liquidas: [
        '25g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '300ml de clara líquida pasteurizada'
      ],
      notes: [
        '❌ Evite usar somente whey isoladamente',
        '🚫 Não utilize caseína (altamente inflamatória)',
        '⚠️ Prefira versões sem sabor - adoçantes artificiais prejudicam a microbiota intestinal',
        'Para saborizar: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    30: {
      options: [
        '120g de carne magra pronta (grelhada ou cozida) - equivalente a 150g crua',
        '8 claras de ovos / 400ml de clara pasteurizada',
        '75g de carne magra pronta + 3 claras de ovos - equivalente a 100g de carne crua + 3 claras'
      ],
      liquidas: [
        '35g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado',
        '400ml de clara líquida pasteurizada'
      ],
      notes: [
        'Evite usar apenas whey em refeições principais',
        'Não use caseína (alta inflamação)',
        'Evite proteínas saborizadas',
        'Para saborizar: 🍋 Limão / 🌿 Stevia / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    40: {
      options: [
        '160g de carne magra pronta - equivalente a 200g crua',
        '10 claras de ovos / 500ml de clara pasteurizada',
        '75g de carne magra pronta + 6 claras - equivalente a 100g de carne crua + 6 claras'
      ],
      liquidas: [
        '50g de albumina / beef protein / BCAA / colágeno / whey isolado',
        '500ml de clara líquida pasteurizada'
      ],
      notes: [
        '❌ Evite apenas whey em refeições completas',
        '🚫 Não use caseína',
        'Prefira sem sabor',
        'Para saborizar: Limão / Stevia / Canela / Cacau 100%'
      ]
    },
    50: {
      options: [
        '190g de carne magra pronta - equivalente a 250g crua',
        '13 claras de ovos / 600ml de clara pasteurizada',
        '110g de carne magra + 6 claras - equivalente a 150g crua + 6 claras'
      ],
      liquidas: [
        '60-65g de albumina / beef protein / BCAA / colágeno / whey isolado',
        '600ml de clara líquida pasteurizada'
      ],
      notes: [
        'Evite somente whey',
        'Não use caseína',
        'Prefira versões sem sabor'
      ]
    },
    60: {
      options: [
        '225g de carne magra pronta - equivalente a 300g crua',
        '15 claras de ovos / 700ml de clara pasteurizada',
        '150g de carne magra + 5 claras - equivalente a 200g crua + 5 claras'
      ],
      liquidas: [
        '70g de albumina / beef protein / BCAA / colágeno / whey isolado',
        '700ml de clara líquida pasteurizada'
      ],
      notes: [
        'Evite somente whey',
        'Não use caseína',
        'Prefira sem sabor'
      ]
    },
    70: {
      options: [
        '260g de carne magra pronta - equivalente a 350g crua',
        '18 claras de ovos / 800ml de clara pasteurizada',
        '185g de carne magra + 5 claras - equivalente a 250g crua + 5 claras'
      ],
      liquidas: [
        '80-85g de albumina / beef protein / BCAA / colágeno / whey isolado',
        '800ml de clara líquida pasteurizada'
      ],
      notes: [
        'Evite somente whey',
        'Não use caseína',
        'Prefira sem sabor'
      ]
    }
  };

// Dados hardcoded de gorduras (movidos para fora do componente)
const fatData: Record<number, { options: string[]; praticas: string; sugestoes: string; aviso: string }> = {
    10: {
      options: [
        'Azeite de oliva extra virgem - 1 colher de sopa (≈11g)',
        'Abacate - 50g (≈3 colheres de sopa cheias)',
        'Castanha-do-pará - 2 unidades médias (≈12g)',
        'Macadâmia - 4 unidades médias (≈14g)',
        'Manteiga - 12g (≈1 colher de chá bem cheia)',
        'Óleo de coco - 10g (≈1 colher de sopa rasa)'
      ],
      praticas: '1 colher de sopa de azeite, óleo de coco ou manteiga derretida. Ideais para: refogados, legumes cozidos, pós-preparo de carnes, smoothies',
      sugestoes: 'Salgados: azeite, manteiga ou óleo de coco. Shakes: abacate ou óleo de coco. Lanches: castanhas ou macadâmia',
      aviso: 'Evite óleos refinados (soja, milho, canola) - altamente inflamatórios e ricos em ômega-6'
    },
    15: {
      options: [
        'Azeite de oliva - 1,5 colheres de sopa (≈16,5g)',
        'Abacate - 75g (≈4,5 colheres de sopa)',
        'Castanha-do-pará - 3 unidades médias (≈18g)',
        'Macadâmia - 6 unidades médias (≈21g)',
        'Manteiga - 18g (≈1,5 colheres de chá)',
        'Óleo de coco - 15g (≈1,5 colheres de sopa)'
      ],
      praticas: '1,5 colheres de sopa de azeite, óleo de coco ou manteiga',
      sugestoes: 'Salgados: azeite, manteiga ou óleo de coco. Shakes: abacate ou óleo de coco. Lanches: castanhas',
      aviso: 'Evite óleos refinados (soja, milho, canola) - ricos em ômega-6 e inflamatórios'
    }
  };

export default function FoodOptionsModal({ isOpen, onClose, nutrientType, amount }: FoodOptionsModalProps) {
  const [options, setOptions] = useState<FoodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hardcodedData, setHardcodedData] = useState<{options: string[], liquidas?: string[], notes?: string[], praticas?: string, sugestoes?: string, aviso?: string} | null>(null);
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
        setHardcodedData(null);
      } else if (nutrientType === 'proteina') {
        // Usar dados hardcoded de proteínas
        const data = proteinData[amount];
        if (data) {
          setHardcodedData(data);
        } else {
          setHardcodedData(null);
        }
        setOptions([]);
      } else if (nutrientType === 'gordura') {
        // Usar dados hardcoded de gorduras
        const data = fatData[amount];
        if (data) {
          setHardcodedData(data);
        } else {
          setHardcodedData(null);
        }
        setOptions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar opcoes:', error);
      setOptions([]);
      setHardcodedData(null);
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
                Opções de Alimentos
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
          ) : (nutrientType === 'proteina' || nutrientType === 'gordura') && hardcodedData ? (
            <>
              {/* Melhores Opções */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <span>🔹</span>
                  MELHORES OPÇÕES
                </h4>
                <div className="space-y-2">
                  {hardcodedData.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${
                        nutrientType === 'proteina'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                      }`}
                    >
                      <p className="text-sm text-gray-900 dark:text-white">{option}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opções Líquidas (apenas proteínas) */}
              {hardcodedData.liquidas && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>🥤</span>
                    Opção líquida (shake/refeição prática)
                  </h4>
                  <div className="space-y-2">
                    {hardcodedData.liquidas.map((option, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-3"
                      >
                        <p className="text-sm text-gray-900 dark:text-white">{option}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opção Prática (apenas gorduras) */}
              {hardcodedData.praticas && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                  <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    🥄 Opção prática
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-200">
                    {hardcodedData.praticas}
                  </p>
                </div>
              )}

              {/* Sugestões (apenas gorduras) */}
              {hardcodedData.sugestoes && (
                <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
                  <h4 className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">
                    💡 Sugestão de uso
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-200">
                    {hardcodedData.sugestoes}
                  </p>
                </div>
              )}

              {/* Notas (proteínas) ou Aviso (gorduras) */}
              {hardcodedData.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 rounded-lg">
                  <div className="space-y-1">
                    {hardcodedData.notes.map((note, idx) => (
                      <p key={idx} className="text-xs text-amber-800 dark:text-amber-200">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {hardcodedData.aviso && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded-lg">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {hardcodedData.aviso}
                  </p>
                </div>
              )}
            </>
          ) : (nutrientType === 'proteina' || nutrientType === 'gordura') && !hardcodedData ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Quantidade não disponível. Consulte o Guia Nutricional para mais opções.
              </p>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma opção encontrada para esta quantidade.
              </p>
            </div>
          ) : (
            <>
              {renderOptions('melhor', 'Melhores Opções', '🔹')}
              {renderOptions('secundaria', 'Opções Secundárias', '🔸')}
              {renderOptions('liquida', 'Opções Líquidas / Práticas', '💧')}

              {/* Nota */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-light">
                  <strong className="font-semibold">Importante:</strong> Todos os alimentos devem ser pesados já cozidos, exceto quando indicado medida caseira.
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
