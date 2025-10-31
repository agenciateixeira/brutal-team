'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Beef, Droplet, Salad, Info, HelpCircle } from 'lucide-react';
import FoodOptionsModal from './FoodOptionsModal';

interface DietaParserProps {
  content: string;
}

interface ParsedSection {
  title: string;
  items: ParsedItem[];
}

interface ParsedItem {
  category: 'proteina' | 'gordura' | 'vegetal' | 'geral';
  text: string;
  quantity?: string;
  alternatives?: ParsedItem[]; // Outras opções agrupadas
}

export default function DietaParser({ content }: DietaParserProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNutrient, setSelectedNutrient] = useState<{ type: 'carboidrato' | 'proteina', amount: number } | null>(null);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const toggleAlternatives = (key: string) => {
    const newExpanded = new Set(expandedAlternatives);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedAlternatives(newExpanded);
  };

  const handleNutrientClick = (type: 'carboidrato' | 'proteina', amount: number) => {
    setSelectedNutrient({ type, amount });
    setModalOpen(true);
  };

  const renderTextWithNutrientLinks = (text: string) => {
    // Detectar padrões como:
    // "30gs de proteínas", "50g de carboidratos"
    // "30g proteína", "50g carbo" (sem o "de")
    const pattern = /(\d+)\s*g?s?\s*(?:de\s*)?(carboidrato|carboidratos|proteína|proteínas|proteina|proteinas|carbo|carbos)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {

      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const amount = parseInt(match[1]);
      const nutrientRaw = match[2].toLowerCase();
      const nutrientType: 'carboidrato' | 'proteina' =
        nutrientRaw.includes('carb') ? 'carboidrato' : 'proteina';

      // Adicionar link clicável
      parts.push(
        <button
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            handleNutrientClick(nutrientType, amount);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded font-medium transition-colors cursor-pointer underline decoration-dotted"
          title={`Ver opcoes de ${nutrientType}`}
        >
          {match[0]}
          <HelpCircle size={14} />
        </button>
      );

      lastIndex = pattern.lastIndex;
    }

    // Adicionar texto restante
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'proteina':
        return <Beef size={18} className="text-red-500 dark:text-red-400" />;
      case 'gordura':
        return <Droplet size={18} className="text-yellow-500 dark:text-yellow-400" />;
      case 'vegetal':
        return <Salad size={18} className="text-green-500 dark:text-green-400" />;
      default:
        return <Info size={18} className="text-blue-500 dark:text-blue-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'proteina':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'gordura':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'vegetal':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const categorizeItem = (text: string): 'proteina' | 'gordura' | 'vegetal' | 'geral' => {
    const lowerText = text.toLowerCase();

    // Proteínas
    if (
      lowerText.includes('proteína') ||
      lowerText.includes('proteina') ||
      lowerText.includes('carne') ||
      lowerText.includes('frango') ||
      lowerText.includes('peixe') ||
      lowerText.includes('ovo') ||
      lowerText.includes('whey') ||
      lowerText.includes('atum') ||
      lowerText.includes('salmão')
    ) {
      return 'proteina';
    }

    // Gorduras
    if (
      lowerText.includes('gordura') ||
      lowerText.includes('azeite') ||
      lowerText.includes('óleo') ||
      lowerText.includes('oleo') ||
      lowerText.includes('castanha') ||
      lowerText.includes('abacate') ||
      lowerText.includes('azeitona') ||
      lowerText.includes('queijo') ||
      lowerText.includes('manteiga') ||
      lowerText.includes('creme de leite') ||
      lowerText.includes('leite de coco') ||
      lowerText.includes('cacau') ||
      lowerText.includes('chocolate')
    ) {
      return 'gordura';
    }

    // Vegetais
    if (
      lowerText.includes('vegetal') ||
      lowerText.includes('vegetais') ||
      lowerText.includes('verde') ||
      lowerText.includes('crucífero') ||
      lowerText.includes('crucifero') ||
      lowerText.includes('salada') ||
      lowerText.includes('brócolis') ||
      lowerText.includes('brocolis') ||
      lowerText.includes('couve')
    ) {
      return 'vegetal';
    }

    return 'geral';
  };

  const extractQuantity = (text: string): { quantity: string; cleanText: string } | null => {
    // Procura por padrões de quantidade: 50g, 150-200g, 10ml, ⅓, 1 ovo, etc
    const quantityMatch = text.match(/^(\d+(?:-\d+)?(?:\.\d+)?|⅓|½|¼|¾)\s*(g|ml|kg|mg|litro|l|unidade|un|und|ovo|ovos)?\s*/i);

    if (quantityMatch) {
      const quantity = quantityMatch[0].trim();
      // Remove a quantidade do início do texto
      const cleanText = text.replace(quantityMatch[0], '').trim();
      return { quantity, cleanText };
    }

    return null;
  };

  const parseSections = (content: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    const lines = content.split('\n');
    let currentSection: ParsedSection | null = null;
    let currentText = '';
    let pendingAlternatives: ParsedItem[] = [];

    const saveCurrentText = () => {
      if (!currentText || !currentSection) return;

      const category = categorizeItem(currentText);
      const extracted = extractQuantity(currentText);

      const item: ParsedItem = {
        category,
        text: extracted ? extracted.cleanText : currentText.trim(),
        quantity: extracted ? extracted.quantity : undefined,
      };

      // Se há alternativas pendentes, adiciona ao item
      if (pendingAlternatives.length > 0) {
        item.alternatives = [...pendingAlternatives];
        pendingAlternatives = [];
      }

      currentSection.items.push(item);
      currentText = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Identifica títulos de seções
      if (
        line.match(/^(refeição|café|almoço|jantar|lanche|ceia|pré|pós)/i) ||
        line.match(/^\d+[hª]/) ||
        line.match(/^[-*]\s*(refeição|café|almoço)/i)
      ) {
        saveCurrentText();
        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          title: line,
          items: [],
        };
        continue;
      }

      // Se não há seção atual, cria uma seção geral
      if (!currentSection) {
        currentSection = {
          title: 'Orientações Gerais',
          items: [],
        };
      }

      // Processa linhas com "ou" - agrupa como alternativas
      if (line.toLowerCase().startsWith('ou ')) {
        const cleanLine = line.replace(/^ou\s+/i, '').trim();
        if (cleanLine) {
          const category = categorizeItem(cleanLine);
          const extracted = extractQuantity(cleanLine);

          pendingAlternatives.push({
            category,
            text: extracted ? extracted.cleanText : cleanLine,
            quantity: extracted ? extracted.quantity : undefined,
          });
        }
      } else if (line) {
        // Se houver texto acumulado e começa uma nova linha (não é "ou"), salva o anterior
        if (currentText && !line.toLowerCase().startsWith('ou ')) {
          saveCurrentText();
        }
        currentText += (currentText ? '\n' : '') + line;
      } else if (currentText) {
        // Linha vazia - salva texto acumulado
        saveCurrentText();
      }
    }

    // Salva última seção
    saveCurrentText();
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseSections(content);

  // Se não conseguiu parsear seções, mostra conteúdo original
  if (sections.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-sans text-sm leading-relaxed">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
        >
          {/* Header da Seção */}
          <button
            onClick={() => toggleSection(sectionIndex)}
            className="w-full px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/30 dark:hover:to-primary-800/30 transition-colors flex items-center justify-between"
          >
            <span className="font-semibold text-gray-900 dark:text-white text-left">
              {section.title}
            </span>
            {expandedSections.has(sectionIndex) ? (
              <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Conteúdo da Seção */}
          {expandedSections.has(sectionIndex) && (
            <div className="p-4 space-y-2">
              {section.items.map((item, itemIndex) => {
                const alternativesKey = `${sectionIndex}-${itemIndex}`;
                const hasAlternatives = item.alternatives && item.alternatives.length > 0;
                const isAlternativesExpanded = expandedAlternatives.has(alternativesKey);

                return (
                  <div key={itemIndex} className="space-y-2">
                    {/* Item Principal */}
                    <div
                      className={`border-l-4 pl-3 py-2 ${getCategoryColor(item.category)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getCategoryIcon(item.category)}
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {renderTextWithNutrientLinks(item.quantity ? `${item.quantity} ${item.text}` : item.text)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Alternativas */}
                    {hasAlternatives && (
                      <div className="pl-7">
                        <button
                          onClick={() => toggleAlternatives(alternativesKey)}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          {isAlternativesExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                          {isAlternativesExpanded
                            ? 'Ocultar alternativas'
                            : `Ver ${item.alternatives!.length} outras opções`}
                        </button>

                        {/* Lista de Alternativas */}
                        {isAlternativesExpanded && (
                          <div className="mt-2 space-y-1">
                            {item.alternatives!.map((alt, altIndex) => (
                              <div
                                key={altIndex}
                                className="pl-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-sm border-l-2 border-gray-300 dark:border-gray-600"
                              >
                                <span className="text-gray-700 dark:text-gray-300">
                                  {renderTextWithNutrientLinks(alt.quantity ? `${alt.quantity} ${alt.text}` : alt.text)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Modal de Opcoes de Alimentos */}
      {selectedNutrient && (
        <FoodOptionsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          nutrientType={selectedNutrient.type}
          amount={selectedNutrient.amount}
        />
      )}
    </div>
  );
}
