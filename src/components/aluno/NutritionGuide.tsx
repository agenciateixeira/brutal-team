'use client';

import { useState } from 'react';
import { Info, Beef, Droplet, Apple } from 'lucide-react';

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

type TabType = 'carboidratos' | 'proteinas' | 'gorduras' | 'frutas';

export default function NutritionGuide({ carbOptions }: NutritionGuideProps) {
  const [activeTab, setActiveTab] = useState<TabType>('carboidratos');
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

  // Dados de proteínas
  const proteinData: Record<number, { options: string[]; liquidas: string[]; blend: string; notes: string[] }> = {
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
      blend: 'Monte um mix com: albumina + beef protein + BCAA + colágeno, ajustando as proporções até atingir 20g de proteína total',
      notes: [
        '❌ Evite usar somente whey isoladamente',
        '🚫 Não utilize caseína (altamente inflamatória)',
        '⚠️ Prefira versões sem sabor - adoçantes artificiais prejudicam a microbiota intestinal e aumentam o desejo por doces',
        'Para saborizar naturalmente, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    30: {
      options: [
        '120g de carne magra pronta (grelhada ou cozida) - equivalente a 150g crua',
        '8 claras de ovos / 400ml de clara pasteurizada',
        '75g de carne magra pronta + 3 claras de ovos - equivalente a 100g de carne crua + 3 claras'
      ],
      liquidas: [
        '35g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '400ml de clara líquida pasteurizada'
      ],
      blend: 'Combine albumina + beef protein + BCAA + colágeno, ajustando a quantidade de cada um até atingir 30g de proteína total',
      notes: [
        'Evite usar apenas whey em refeições principais',
        'Não use caseína (alta inflamação)',
        'Evite proteínas saborizadas - adoçantes prejudicam a microbiota e aumentam o desejo por doce',
        'Se quiser dar sabor, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    40: {
      options: [
        '160g de carne magra pronta (grelhada ou cozida) - equivalente a 200g crua',
        '10 claras de ovos / 500ml de clara pasteurizada',
        '75g de carne magra pronta + 6 claras de ovos - equivalente a 100g de carne crua + 6 claras'
      ],
      liquidas: [
        '50g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '500ml de clara líquida pasteurizada'
      ],
      blend: 'Monte um mix com albumina + beef protein + BCAA + colágeno, dividindo as proporções de cada até atingir 40g de proteína total',
      notes: [
        '❌ Evite usar apenas whey em refeições completas',
        '❌ Não utilize caseína (altamente inflamatória)',
        '🚫 Prefira proteínas sem sabor - adoçantes alteram a microbiota e aumentam o desejo por doces',
        'Para saborizar naturalmente, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    50: {
      options: [
        '190g de carne magra pronta (grelhada ou cozida) - equivalente a 250g crua',
        '13 claras de ovos / 600ml de clara pasteurizada',
        '110g de carne magra pronta + 6 claras de ovos - equivalente a 150g de carne crua + 6 claras'
      ],
      liquidas: [
        '60-65g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '600ml de clara líquida pasteurizada'
      ],
      blend: 'Monte um mix com: albumina + beef protein + BCAA + colágeno, ajustando as quantidades de cada até atingir 50g de proteína total',
      notes: [
        '❌ Evite usar somente whey isoladamente',
        '🚫 Não use caseína (altamente inflamatória)',
        '⚠️ Prefira versões sem sabor - adoçantes alteram a microbiota e aumentam a vontade por doces',
        'Para saborizar naturalmente, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    60: {
      options: [
        '225g de carne magra pronta (grelhada ou cozida) - equivalente a 300g crua',
        '15 claras de ovos / 700ml de clara pasteurizada',
        '150g de carne magra pronta + 5 claras de ovos - equivalente a 200g de carne crua + 5 claras'
      ],
      liquidas: [
        '70g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '700ml de clara líquida pasteurizada'
      ],
      blend: 'Monte um mix com: albumina + beef protein + BCAA + colágeno, ajustando as proporções até atingir 60g de proteína total',
      notes: [
        '❌ Evite usar somente whey isoladamente',
        '🚫 Não use caseína (altamente inflamatória)',
        '⚠️ Prefira versões sem sabor - adoçantes prejudicam a microbiota e aumentam o desejo por doces',
        'Para saborizar naturalmente, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    },
    70: {
      options: [
        '260g de carne magra pronta (grelhada ou cozida) - equivalente a 350g crua',
        '18 claras de ovos / 800ml de clara pasteurizada',
        '185g de carne magra pronta + 5 claras de ovos - equivalente a 250g de carne crua + 5 claras'
      ],
      liquidas: [
        '80-85g de albumina / beef protein / BCAA / aminoácidos essenciais / colágeno / whey isolado ou hidrolisado / proteínas vegetais',
        '800ml de clara líquida pasteurizada'
      ],
      blend: 'Monte um mix proteico com: albumina + beef protein + BCAA + colágeno, ajustando as quantidades conforme o rótulo até atingir 70g de proteína total',
      notes: [
        '❌ Evite usar somente whey isoladamente',
        '🚫 Não use caseína (altamente inflamatória)',
        '⚠️ Prefira versões sem sabor - adoçantes artificiais prejudicam a microbiota intestinal e aumentam o desejo por paladar doce',
        'Para dar sabor naturalmente, use: 🍋 Limão / 🌿 Stevia pura / 🌰 Canela / 🍫 Cacau 100%'
      ]
    }
  };

  // Dados de gorduras
  const fatData: Record<number, { options: string[]; praticas: string; sugestoes: string; aviso: string }> = {
    10: {
      options: [
        'Azeite de oliva extra virgem - 1 colher de sopa (≈11g) → fornece 10g de gordura',
        'Abacate - 50g (≈3 colheres de sopa cheias) → fornece 10g de gordura',
        'Castanha-do-pará - 2 unidades médias (≈12g) → fornece 10g de gordura',
        'Macadâmia - 4 unidades médias (≈14g) → fornece 10g de gordura',
        'Manteiga - 12g (≈1 colher de chá bem cheia) → fornece 10g de gordura',
        'Óleo de coco - 10g (≈1 colher de sopa rasa) → fornece 10g de gordura'
      ],
      praticas: '1 colher de sopa de azeite, óleo de coco ou manteiga derretida (todas fornecem em torno de 10g de gordura). Ideais para: refogados, legumes cozidos, pós-preparo de carnes, smoothies',
      sugestoes: 'Para refeições salgadas: azeite, manteiga ou óleo de coco. Para shakes ou cremes: abacate ou óleo de coco. Para lanches: castanhas ou macadâmia',
      aviso: 'Evite óleos refinados (como soja, milho e canola) - altamente inflamatórios e ricos em ômega-6. Prefira sempre fontes naturais e minimamente processadas'
    },
    15: {
      options: [
        'Azeite de oliva extra virgem - 1,5 colheres de sopa (≈16,5g) → fornece 15g de gordura',
        'Abacate - 75g (≈4,5 colheres de sopa cheias) → fornece 15g de gordura',
        'Castanha-do-pará - 3 unidades médias (≈18g) → fornece 15g de gordura',
        'Macadâmia - 6 unidades médias (≈21g) → fornece 15g de gordura',
        'Manteiga - 18g (≈1,5 colheres de chá bem cheias) → fornece 15g de gordura',
        'Óleo de coco - 15g (≈1,5 colheres de sopa rasas) → fornece 15g de gordura'
      ],
      praticas: '1,5 colheres de sopa de azeite, óleo de coco ou manteiga derretida (todas fornecem em torno de 15g de gordura)',
      sugestoes: 'Para refeições salgadas: azeite, manteiga ou óleo de coco. Para shakes ou cremes: abacate ou óleo de coco. Para lanches: castanhas ou macadâmia',
      aviso: 'Evite óleos refinados (soja, milho e canola) - ricos em ômega-6 e inflamatórios'
    }
  };

  // Dados de frutas
  const fruitData = {
    '20g': ['Banana', 'Uvas', 'Figo'],
    '15g': ['Abacaxi', 'Manga', 'Uva', 'Lichia', 'Goiaba', 'Maçã', 'Pera'],
    '10g': ['Melão', 'Laranja', 'Melancia', 'Pêssego', 'Água de Coco (ml)', 'Tangerina', 'Kiwi', 'Ameixa in natura', 'Polpa de Acerola (ml)', 'Mamão'],
    '5g': ['Framboesa', 'Amora', 'Morango', 'Limão espremido (ml)']
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('carboidratos')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'carboidratos'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            🍚 Carboidratos
          </button>
          <button
            onClick={() => {
              setActiveTab('proteinas');
              setSelectedAmount(30);
            }}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'proteinas'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Beef size={20} />
            Proteínas
          </button>
          <button
            onClick={() => {
              setActiveTab('gorduras');
              setSelectedAmount(10);
            }}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'gorduras'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Droplet size={20} />
            Gorduras
          </button>
          <button
            onClick={() => setActiveTab('frutas')}
            className={`flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'frutas'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Apple size={20} />
            Frutas
          </button>
        </div>
      </div>

      {/* Conteúdo - CARBOIDRATOS */}
      {activeTab === 'carboidratos' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Selecione a quantidade de carboidratos
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[20, 40, 60, 80, 100].map((amount) => (
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

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Opções para {selectedAmount}g de Carboidratos
            </h2>

            {(() => {
              const options = getOptionsForAmount(selectedAmount);
              const observation = getObservation(selectedAmount);

              return (
                <>
                  {renderOptions(options, 'melhor', 'Melhores Opções', '🔹')}
                  {renderOptions(options, 'secundaria', 'Opções Secundárias', '🔸')}
                  {renderOptions(options, 'liquida', 'Opções Líquidas / Práticas', '💧')}

                  {observation && observation.notes && (
                    <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Info className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                            Observação Importante
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-200 font-light">
                            {observation.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-light">
                      <strong className="font-semibold">Importante:</strong> Todos os alimentos devem ser pesados já cozidos, exceto quando indicado medida caseira (colher de sopa, etc).
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Conteúdo - PROTEÍNAS */}
      {activeTab === 'proteinas' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Selecione a quantidade de proteínas
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[20, 30, 40, 50, 60, 70].map((amount) => (
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

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {selectedAmount}g de proteína com baixo teor de gordura (peso PRONTO)
            </h2>

            {proteinData[selectedAmount] && (
              <>
                {/* Melhores Opções */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🔹</span>
                    MELHORES OPÇÕES
                  </h3>
                  <div className="space-y-2">
                    {proteinData[selectedAmount].options.map((option, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 p-4"
                      >
                        <p className="text-gray-900 dark:text-white">{option}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opções Líquidas */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🥤</span>
                    Opção líquida (use somente se precisar fazer shake/refeição prática)
                  </h3>
                  <div className="space-y-2">
                    {proteinData[selectedAmount].liquidas.map((option, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4"
                      >
                        <p className="text-gray-900 dark:text-white">{option}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blend */}
                <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                    💡 Sugestão de Blend
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-200">
                    {proteinData[selectedAmount].blend}
                  </p>
                </div>

                {/* Notas */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg">
                  <div className="space-y-2">
                    {proteinData[selectedAmount].notes.map((note, idx) => (
                      <p key={idx} className="text-sm text-amber-800 dark:text-amber-200">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Conteúdo - GORDURAS */}
      {activeTab === 'gorduras' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Selecione a quantidade de gorduras
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[10, 15].map((amount) => (
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

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {selectedAmount}g de gordura com baixo teor de impurezas (peso PRONTO)
            </h2>

            {fatData[selectedAmount] && (
              <>
                {/* Melhores Opções */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🔹</span>
                    MELHORES OPÇÕES
                  </h3>
                  <div className="space-y-2">
                    {fatData[selectedAmount].options.map((option, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 p-4"
                      >
                        <p className="text-gray-900 dark:text-white">{option}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opção Prática */}
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    🥄 Opção prática (uso culinário ou líquida)
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    {fatData[selectedAmount].praticas}
                  </p>
                </div>

                {/* Sugestões */}
                <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                    💡 Sugestão de uso
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-200">
                    {fatData[selectedAmount].sugestoes}
                  </p>
                </div>

                {/* Aviso */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {fatData[selectedAmount].aviso}
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Conteúdo - FRUTAS */}
      {activeTab === 'frutas' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tabela de Carboidratos em Frutas (a cada 100g)
          </h2>

          <div className="space-y-6">
            {Object.entries(fruitData).map(([carbs, fruits]) => (
              <div key={carbs} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-3">
                  {carbs} de carboidratos em média a cada 100g
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fruits.map((fruit, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium"
                    >
                      {fruit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-light">
              <strong className="font-semibold">Importante:</strong> As quantidades de carboidratos são aproximadas e se referem a frutas in natura. O peso deve ser medido após limpeza e remoção de cascas/sementes quando aplicável.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
