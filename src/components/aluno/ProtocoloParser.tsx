'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Syringe, Pill, Droplet, Shield, Activity, Info } from 'lucide-react';

interface ProtocoloParserProps {
  content: string;
}

interface ParsedSection {
  title: string;
  items: ParsedItem[];
}

interface ParsedItem {
  category: 'trt' | 'hgh' | 'peptide' | 'ai' | 'serm' | 'hcg' | 'thyroid' | 'geral';
  text: string;
  dosage?: string;
  frequency?: string;
  timing?: string;
  alternatives?: ParsedItem[];
}

export default function ProtocoloParser({ content }: ProtocoloParserProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trt':
        return <Syringe size={18} className="text-blue-500 dark:text-blue-400" />;
      case 'hgh':
        return <Activity size={18} className="text-purple-500 dark:text-purple-400" />;
      case 'peptide':
        return <Droplet size={18} className="text-cyan-500 dark:text-cyan-400" />;
      case 'ai':
        return <Shield size={18} className="text-orange-500 dark:text-orange-400" />;
      case 'serm':
        return <Pill size={18} className="text-pink-500 dark:text-pink-400" />;
      case 'hcg':
        return <Syringe size={18} className="text-green-500 dark:text-green-400" />;
      case 'thyroid':
        return <Activity size={18} className="text-red-500 dark:text-red-400" />;
      default:
        return <Info size={18} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trt':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'hgh':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'peptide':
        return 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/10';
      case 'ai':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'serm':
        return 'border-l-pink-500 bg-pink-50 dark:bg-pink-900/10';
      case 'hcg':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'thyroid':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const categorizeItem = (text: string): 'trt' | 'hgh' | 'peptide' | 'ai' | 'serm' | 'hcg' | 'thyroid' | 'geral' => {
    const lowerText = text.toLowerCase();

    // TRT - Testosterona
    if (
      lowerText.includes('testosterona') ||
      lowerText.includes('trt') ||
      lowerText.includes('cipionato') ||
      lowerText.includes('enantato') ||
      lowerText.includes('propionato') ||
      lowerText.includes('undecanoato') ||
      lowerText.includes('durateston') ||
      lowerText.includes('sustanon')
    ) {
      return 'trt';
    }

    // HGH - Hormônio do Crescimento
    if (
      lowerText.includes('hgh') ||
      lowerText.includes('hormônio do crescimento') ||
      lowerText.includes('hormonio do crescimento') ||
      lowerText.includes('somatotropina') ||
      lowerText.includes('gh ')
    ) {
      return 'hgh';
    }

    // Peptídeos
    if (
      lowerText.includes('peptide') ||
      lowerText.includes('peptídeo') ||
      lowerText.includes('peptideo') ||
      lowerText.includes('bpc-157') ||
      lowerText.includes('bpc 157') ||
      lowerText.includes('tb-500') ||
      lowerText.includes('tb 500') ||
      lowerText.includes('ipamorelin') ||
      lowerText.includes('cjc-1295') ||
      lowerText.includes('ghrp') ||
      lowerText.includes('sermorelin')
    ) {
      return 'peptide';
    }

    // Inibidores de Aromatase (AI)
    if (
      lowerText.includes('anastrozol') ||
      lowerText.includes('arimidex') ||
      lowerText.includes('exemestano') ||
      lowerText.includes('aromasin') ||
      lowerText.includes('letrozol') ||
      lowerText.includes('femara') ||
      lowerText.includes('inibidor de aromatase')
    ) {
      return 'ai';
    }

    // SERMs - Moduladores Seletivos do Receptor de Estrogênio
    if (
      lowerText.includes('tamoxifeno') ||
      lowerText.includes('nolvadex') ||
      lowerText.includes('clomifeno') ||
      lowerText.includes('clomid') ||
      lowerText.includes('raloxifeno') ||
      lowerText.includes('evista') ||
      lowerText.includes('serm')
    ) {
      return 'serm';
    }

    // HCG - Gonadotrofina Coriônica Humana
    if (
      lowerText.includes('hcg') ||
      lowerText.includes('gonadotrofina') ||
      lowerText.includes('pregnyl') ||
      lowerText.includes('ovidrel')
    ) {
      return 'hcg';
    }

    // Hormônios da Tireoide
    if (
      lowerText.includes('t3') ||
      lowerText.includes('t4') ||
      lowerText.includes('tireoide') ||
      lowerText.includes('levotiroxina') ||
      lowerText.includes('puran') ||
      lowerText.includes('liotironina') ||
      lowerText.includes('cytomel')
    ) {
      return 'thyroid';
    }

    return 'geral';
  };

  const extractDosageFrequencyTiming = (text: string): {
    dosage?: string;
    frequency?: string;
    timing?: string;
    cleanText: string;
  } => {
    let cleanText = text;
    const result: {
      dosage?: string;
      frequency?: string;
      timing?: string;
      cleanText: string;
    } = { cleanText };

    // Extrai dosagem (mg, ml, IU, mcg)
    const dosageMatch = text.match(/(\d+(?:\.\d+)?)\s*(mg|ml|iu|ui|mcg|µg)/i);
    if (dosageMatch) {
      result.dosage = `${dosageMatch[1]}${dosageMatch[2].toLowerCase()}`;
      cleanText = cleanText.replace(dosageMatch[0], '').trim();
    }

    // Extrai frequência
    const frequencyPatterns = [
      /diariamente|diário|todos os dias|por dia/i,
      /dia sim[,\s]+dia não|eod|a cada (?:2|dois) dias/i,
      /(?:2|duas|3|três|4|quatro)x?\s*(?:por|na)?\s*semana/i,
      /semanal|semanalmente|(?:1|uma)x?\s*(?:por|na)?\s*semana/i,
      /quinzenal|a cada (?:15|quinze) dias/i,
      /mensal|mensalmente|(?:1|uma)x?\s*(?:por|ao)?\s*mês/i,
    ];

    for (const pattern of frequencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.frequency = match[0];
        cleanText = cleanText.replace(match[0], '').trim();
        break;
      }
    }

    // Extrai horário/timing
    const timingPatterns = [
      /pela manhã|de manhã|ao acordar|em jejum/i,
      /à noite|a noite|antes de dormir|ao deitar/i,
      /pré[- ]treino|antes do treino/i,
      /pós[- ]treino|depois do treino|após o treino/i,
      /com a refeição|durante a refeição|junto com/i,
    ];

    for (const pattern of timingPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.timing = match[0];
        cleanText = cleanText.replace(match[0], '').trim();
        break;
      }
    }

    result.cleanText = cleanText.replace(/\s+/g, ' ').trim();
    return result;
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
      const extracted = extractDosageFrequencyTiming(currentText);

      const item: ParsedItem = {
        category,
        text: extracted.cleanText,
        dosage: extracted.dosage,
        frequency: extracted.frequency,
        timing: extracted.timing,
      };

      if (pendingAlternatives.length > 0) {
        item.alternatives = [...pendingAlternatives];
        pendingAlternatives = [];
      }

      currentSection.items.push(item);
      currentText = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Identifica títulos de seções (protocolos, ciclos, fases)
      if (
        line.match(/^(protocolo|ciclo|fase|semana|mês)/i) ||
        line.match(/^[-*]\s*(protocolo|ciclo|fase)/i)
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

      if (!currentSection) {
        currentSection = {
          title: 'Protocolo Geral',
          items: [],
        };
      }

      // Processa alternativas
      if (line.toLowerCase().startsWith('ou ')) {
        const cleanLine = line.replace(/^ou\s+/i, '').trim();
        if (cleanLine) {
          const category = categorizeItem(cleanLine);
          const extracted = extractDosageFrequencyTiming(cleanLine);

          pendingAlternatives.push({
            category,
            text: extracted.cleanText,
            dosage: extracted.dosage,
            frequency: extracted.frequency,
            timing: extracted.timing,
          });
        }
      } else if (line) {
        if (currentText && !line.toLowerCase().startsWith('ou ')) {
          saveCurrentText();
        }
        currentText += (currentText ? '\n' : '') + line;
      } else if (currentText) {
        saveCurrentText();
      }
    }

    saveCurrentText();
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseSections(content);

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

          {expandedSections.has(sectionIndex) && (
            <div className="p-4 space-y-2">
              {section.items.map((item, itemIndex) => {
                const alternativesKey = `${sectionIndex}-${itemIndex}`;
                const hasAlternatives = item.alternatives && item.alternatives.length > 0;
                const isAlternativesExpanded = expandedAlternatives.has(alternativesKey);

                return (
                  <div key={itemIndex} className="space-y-2">
                    <div className={`border-l-4 pl-3 py-2 ${getCategoryColor(item.category)}`}>
                      <div className="flex items-start gap-2">
                        {getCategoryIcon(item.category)}
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-1">
                            {item.dosage && (
                              <span className="inline-block px-2 py-0.5 bg-blue-200 dark:bg-blue-700 text-xs font-semibold text-blue-800 dark:text-blue-200 rounded">
                                {item.dosage}
                              </span>
                            )}
                            {item.frequency && (
                              <span className="inline-block px-2 py-0.5 bg-green-200 dark:bg-green-700 text-xs font-semibold text-green-800 dark:text-green-200 rounded">
                                {item.frequency}
                              </span>
                            )}
                            {item.timing && (
                              <span className="inline-block px-2 py-0.5 bg-purple-200 dark:bg-purple-700 text-xs font-semibold text-purple-800 dark:text-purple-200 rounded">
                                {item.timing}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.text}
                          </span>
                        </div>
                      </div>
                    </div>

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

                        {isAlternativesExpanded && (
                          <div className="mt-2 space-y-1">
                            {item.alternatives!.map((alt, altIndex) => (
                              <div
                                key={altIndex}
                                className="pl-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-sm border-l-2 border-gray-300 dark:border-gray-600"
                              >
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {alt.dosage && (
                                    <span className="inline-block px-1.5 py-0.5 bg-blue-200 dark:bg-blue-700 text-xs font-semibold text-blue-800 dark:text-blue-200 rounded">
                                      {alt.dosage}
                                    </span>
                                  )}
                                  {alt.frequency && (
                                    <span className="inline-block px-1.5 py-0.5 bg-green-200 dark:bg-green-700 text-xs font-semibold text-green-800 dark:text-green-200 rounded">
                                      {alt.frequency}
                                    </span>
                                  )}
                                  {alt.timing && (
                                    <span className="inline-block px-1.5 py-0.5 bg-purple-200 dark:bg-purple-700 text-xs font-semibold text-purple-800 dark:text-purple-200 rounded">
                                      {alt.timing}
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {alt.text}
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
    </div>
  );
}
