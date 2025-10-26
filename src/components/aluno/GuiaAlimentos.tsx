'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Beef, Droplet, Salad, Wheat, Info, X } from 'lucide-react';

interface Alimento {
  nome: string;
  porcao: string;
  proteina: string;
  gordura: string;
  calorias: string;
  obs?: string;
}

interface Categoria {
  categoria: string;
  alimentos: Alimento[];
}

interface GuiaAlimentosProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuiaAlimentos({ isOpen, onClose }: GuiaAlimentosProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fecha modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const guiaData: {
    [key: string]: {
      title: string;
      icon: any;
      color: string;
      items: Categoria[];
    };
  } = {
    proteinas: {
      title: 'Proteínas',
      icon: Beef,
      color: 'red',
      items: [
        {
          categoria: 'Carnes Vermelhas',
          alimentos: [
            { nome: 'Carne bovina magra', porcao: '100g', proteina: '26g', gordura: '6g', calorias: '171kcal' },
            { nome: 'Patinho', porcao: '100g', proteina: '29g', gordura: '4g', calorias: '160kcal' },
            { nome: 'Filé mignon', porcao: '100g', proteina: '27g', gordura: '8g', calorias: '191kcal' },
          ]
        },
        {
          categoria: 'Aves',
          alimentos: [
            { nome: 'Peito de frango', porcao: '100g', proteina: '31g', gordura: '3g', calorias: '165kcal' },
            { nome: 'Coxa de frango (sem pele)', porcao: '100g', proteina: '21g', gordura: '9g', calorias: '175kcal' },
            { nome: 'Peito de peru', porcao: '100g', proteina: '29g', gordura: '1g', calorias: '135kcal' },
          ]
        },
        {
          categoria: 'Peixes',
          alimentos: [
            { nome: 'Salmão', porcao: '100g', proteina: '25g', gordura: '13g', calorias: '231kcal' },
            { nome: 'Atum', porcao: '100g', proteina: '26g', gordura: '1g', calorias: '118kcal' },
            { nome: 'Tilápia', porcao: '100g', proteina: '20g', gordura: '2g', calorias: '96kcal' },
          ]
        },
        {
          categoria: 'Ovos',
          alimentos: [
            { nome: 'Ovo de galinha (grande)', porcao: '1 unidade', proteina: '6g', gordura: '5g', calorias: '72kcal' },
            { nome: 'Ovo de galinha (médio)', porcao: '1 unidade', proteina: '5g', gordura: '4g', calorias: '61kcal' },
            { nome: 'Ovo de codorna', porcao: '6 unidades', proteina: '6g', gordura: '5g', calorias: '79kcal' },
            { nome: 'Clara de ovo', porcao: '100g', proteina: '11g', gordura: '0g', calorias: '48kcal' },
          ]
        },
        {
          categoria: 'Suplementos',
          alimentos: [
            { nome: 'Whey protein', porcao: '30g (1 scoop)', proteina: '24g', gordura: '1g', calorias: '112kcal' },
            { nome: 'Caseína', porcao: '30g', proteina: '24g', gordura: '1g', calorias: '110kcal' },
          ]
        }
      ]
    },
    gorduras: {
      title: 'Gorduras Saudáveis',
      icon: Droplet,
      color: 'yellow',
      items: [
        {
          categoria: 'Óleos',
          alimentos: [
            { nome: 'Azeite de oliva extra virgem', porcao: '10ml (1 colher sopa)', proteina: '0g', gordura: '10g', calorias: '90kcal' },
            { nome: 'Óleo de coco', porcao: '10ml', proteina: '0g', gordura: '10g', calorias: '90kcal' },
            { nome: 'Óleo de macadâmia', porcao: '10ml', proteina: '0g', gordura: '10g', calorias: '90kcal' },
          ]
        },
        {
          categoria: 'Castanhas e Sementes',
          alimentos: [
            { nome: 'Castanha do Pará', porcao: '15g (3 unidades)', proteina: '2g', gordura: '10g', calorias: '109kcal' },
            { nome: 'Castanha de caju', porcao: '15g', proteina: '3g', gordura: '7g', calorias: '87kcal' },
            { nome: 'Amêndoas', porcao: '15g', proteina: '3g', gordura: '7g', calorias: '87kcal' },
            { nome: 'Macadâmia', porcao: '15g', proteina: '1g', gordura: '11g', calorias: '108kcal' },
            { nome: 'Nozes', porcao: '15g', proteina: '2g', gordura: '10g', calorias: '98kcal' },
          ]
        },
        {
          categoria: 'Frutas',
          alimentos: [
            { nome: 'Abacate', porcao: '75g (½ pequeno)', proteina: '2g', gordura: '11g', calorias: '120kcal' },
            { nome: 'Azeitonas verdes', porcao: '75g', proteina: '1g', gordura: '11g', calorias: '105kcal' },
          ]
        },
        {
          categoria: 'Laticínios',
          alimentos: [
            { nome: 'Manteiga', porcao: '10g (1 colher sopa)', proteina: '0g', gordura: '8g', calorias: '72kcal' },
            { nome: 'Creme de leite', porcao: '10g', proteina: '0g', gordura: '2g', calorias: '20kcal' },
            { nome: 'Queijo mussarela de búfala', porcao: '30g', proteina: '6g', gordura: '5g', calorias: '75kcal' },
            { nome: 'Queijo feta', porcao: '30g', proteina: '4g', gordura: '6g', calorias: '75kcal' },
          ]
        },
        {
          categoria: 'Outros',
          alimentos: [
            { nome: 'Leite de coco', porcao: '10g', proteina: '0g', gordura: '2g', calorias: '18kcal' },
            { nome: 'Cacau 100%', porcao: '10g', proteina: '2g', gordura: '1g', calorias: '23kcal' },
            { nome: 'Chocolate 99%', porcao: '10g', proteina: '1g', gordura: '5g', calorias: '58kcal' },
          ]
        }
      ]
    },
    vegetais: {
      title: 'Vegetais',
      icon: Salad,
      color: 'green',
      items: [
        {
          categoria: 'Folhas Verdes',
          alimentos: [
            { nome: 'Brócolis', porcao: '100g', proteina: '3g', gordura: '0g', calorias: '34kcal', obs: 'Rico em vitamina C' },
            { nome: 'Couve', porcao: '100g', proteina: '3g', gordura: '1g', calorias: '25kcal', obs: 'Rico em cálcio' },
            { nome: 'Espinafre', porcao: '100g', proteina: '3g', gordura: '0g', calorias: '23kcal', obs: 'Rico em ferro' },
            { nome: 'Rúcula', porcao: '100g', proteina: '3g', gordura: '1g', calorias: '25kcal' },
            { nome: 'Alface', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '15kcal' },
          ]
        },
        {
          categoria: 'Crucíferos',
          alimentos: [
            { nome: 'Couve-flor', porcao: '100g', proteina: '2g', gordura: '0g', calorias: '25kcal' },
            { nome: 'Repolho', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '25kcal' },
            { nome: 'Couve de Bruxelas', porcao: '100g', proteina: '3g', gordura: '0g', calorias: '43kcal' },
          ]
        },
        {
          categoria: 'Outros Vegetais Low Carb',
          alimentos: [
            { nome: 'Abobrinha', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '17kcal' },
            { nome: 'Pepino', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '15kcal' },
            { nome: 'Tomate', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '18kcal' },
            { nome: 'Pimentão', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '20kcal' },
            { nome: 'Aspargos', porcao: '100g', proteina: '2g', gordura: '0g', calorias: '20kcal' },
          ]
        }
      ]
    },
    carboidratos: {
      title: 'Carboidratos',
      icon: Wheat,
      color: 'blue',
      items: [
        {
          categoria: 'Complexos',
          alimentos: [
            { nome: 'Arroz integral', porcao: '100g cozido', proteina: '3g', gordura: '1g', calorias: '124kcal' },
            { nome: 'Batata doce', porcao: '100g', proteina: '2g', gordura: '0g', calorias: '86kcal' },
            { nome: 'Aveia', porcao: '30g', proteina: '4g', gordura: '2g', calorias: '117kcal' },
            { nome: 'Quinoa', porcao: '100g cozida', proteina: '4g', gordura: '2g', calorias: '120kcal' },
            { nome: 'Mandioca', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '125kcal' },
          ]
        },
        {
          categoria: 'Frutas',
          alimentos: [
            { nome: 'Banana', porcao: '100g (1 média)', proteina: '1g', gordura: '0g', calorias: '89kcal' },
            { nome: 'Maçã', porcao: '100g', proteina: '0g', gordura: '0g', calorias: '52kcal' },
            { nome: 'Morango', porcao: '100g', proteina: '1g', gordura: '0g', calorias: '32kcal' },
          ]
        },
        {
          categoria: 'Pães e Massas Integrais',
          alimentos: [
            { nome: 'Pão integral', porcao: '50g (2 fatias)', proteina: '4g', gordura: '2g', calorias: '128kcal' },
            { nome: 'Macarrão integral', porcao: '100g cozido', proteina: '5g', gordura: '1g', calorias: '138kcal' },
          ]
        }
      ]
    }
  };

  return (
    <>
      {/* Overlay - Fundo escuro */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Modal - Fullscreen mobile, centralizado desktop */}
        <div className="bg-white dark:bg-gray-800 w-full max-h-[95vh] md:h-auto md:max-w-4xl md:max-h-[90vh] rounded-t-3xl md:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-slideUp md:animate-fadeIn">

          {/* Handle Mobile - Barra de arrastar (padrão iOS/Android) */}
          <div className="md:hidden pt-2 pb-1 flex justify-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          {/* Header com botão fechar */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-4 py-3 md:py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">
                    📖 Guia de Alimentos
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 md:mt-1">
                    Valores nutricionais (TBCA)
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 ml-2"
              aria-label="Fechar"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Conteúdo com scroll */}
          <div className="flex-1 overflow-y-auto">

      {/* Seções */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(guiaData).map(([key, section]) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(key);

          const colorClasses = {
            red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10',
            yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
            green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10',
            blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10',
          }[section.color];

          return (
            <div key={key}>
              {/* Botão da Seção */}
              <button
                onClick={() => toggleSection(key)}
                className={`w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between ${colorClasses}`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={20} />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Conteúdo da Seção */}
              {isExpanded && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                  {section.items.map((categoria, catIndex) => (
                    <div key={catIndex}>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {categoria.categoria}
                      </h4>
                      <div className="space-y-2">
                        {categoria.alimentos.map((alimento, aliIndex) => (
                          <div
                            key={aliIndex}
                            className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {alimento.nome}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Porção: {alimento.porcao}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                                  P: {alimento.proteina}
                                </span>
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded">
                                  G: {alimento.gordura}
                                </span>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                  {alimento.calorias}
                                </span>
                              </div>
                            </div>
                            {alimento.obs && (
                              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">
                                💡 {alimento.obs}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

          {/* Footer com Dicas */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>💡 <strong>Dica:</strong> Varie os alimentos ao longo da semana para garantir todos os nutrientes</p>
              <p>⚠️ <strong>Importante:</strong> Sempre consulte seu coach antes de substituir alimentos da sua dieta</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
