'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Beef, Droplet, Salad, Info } from 'lucide-react';

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
}

export default function DietaParser({ content }: DietaParserProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
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

  const extractQuantity = (text: string): string | undefined => {
    // Procura por padrões de quantidade: 50g, 150-200g, 10ml, etc
    const quantityMatch = text.match(/(\d+(?:-\d+)?(?:\.\d+)?)\s*(g|ml|kg|mg|litro|l|unidade|un|und)/i);
    return quantityMatch ? quantityMatch[0] : undefined;
  };

  const parseSections = (content: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    const lines = content.split('\n');
    let currentSection: ParsedSection | null = null;
    let currentText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Identifica títulos de seções
      if (
        line.match(/^(refeição|café|almoço|jantar|lanche|ceia|pré|pós)/i) ||
        line.match(/^\d+[hª]/) ||
        line.match(/^[-*]\s*(refeição|café|almoço)/i)
      ) {
        // Salva seção anterior se existir
        if (currentSection && currentText) {
          currentSection.items.push({
            category: 'geral',
            text: currentText.trim(),
          });
          currentText = '';
        }
        if (currentSection) {
          sections.push(currentSection);
        }

        // Cria nova seção
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

      // Processa linhas com "ou" - opções de escolha
      if (line.toLowerCase().includes('ou ') || line.startsWith('ou')) {
        // Salva texto acumulado
        if (currentText) {
          const category = categorizeItem(currentText);
          currentSection.items.push({
            category,
            text: currentText.trim(),
            quantity: extractQuantity(currentText),
          });
          currentText = '';
        }

        // Adiciona a opção
        const cleanLine = line.replace(/^ou\s+/i, '').trim();
        if (cleanLine) {
          const category = categorizeItem(cleanLine);
          currentSection.items.push({
            category,
            text: cleanLine,
            quantity: extractQuantity(cleanLine),
          });
        }
      } else if (line) {
        currentText += (currentText ? '\n' : '') + line;
      } else if (currentText) {
        // Linha vazia - salva texto acumulado
        const category = categorizeItem(currentText);
        currentSection.items.push({
          category,
          text: currentText.trim(),
          quantity: extractQuantity(currentText),
        });
        currentText = '';
      }
    }

    // Salva última seção
    if (currentText && currentSection) {
      const category = categorizeItem(currentText);
      currentSection.items.push({
        category,
        text: currentText.trim(),
        quantity: extractQuantity(currentText),
      });
    }
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
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`border-l-4 pl-3 py-2 ${getCategoryColor(item.category)}`}
                >
                  <div className="flex items-start gap-2">
                    {getCategoryIcon(item.category)}
                    <div className="flex-1">
                      {item.quantity && (
                        <span className="inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded mr-2">
                          {item.quantity}
                        </span>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.text}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
