'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Dumbbell, Activity, Target, Info, Heart, Clock, Weight } from 'lucide-react';

interface TreinoParserProps {
  content: string;
}

interface ParsedSection {
  title: string;
  items: ParsedItem[];
}

interface ParsedItem {
  category: 'superior' | 'inferior' | 'cardio' | 'core' | 'geral';
  text: string;
  series?: string;
  reps?: string;
  rest?: string;
  cardioTime?: string;  // 45m, 30m, etc
  bpm?: string;  // 120bpm, 140bpm, etc
  alternatives?: ParsedItem[];
}

export default function TreinoParser({ content }: TreinoParserProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<string>>(new Set());
  const [cargas, setCargas] = useState<Record<string, string>>({});

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
      case 'superior':
        return <Dumbbell size={18} className="text-blue-500 dark:text-blue-400" />;
      case 'inferior':
        return <Target size={18} className="text-purple-500 dark:text-purple-400" />;
      case 'cardio':
        return <Activity size={18} className="text-red-500 dark:text-red-400" />;
      case 'core':
        return <Target size={18} className="text-orange-500 dark:text-orange-400" />;
      default:
        return <Info size={18} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'superior':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'inferior':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'cardio':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'core':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const categorizeItem = (text: string): 'superior' | 'inferior' | 'cardio' | 'core' | 'geral' => {
    const lowerText = text.toLowerCase();

    // Superior
    if (
      lowerText.includes('peito') ||
      lowerText.includes('peitoral') ||
      lowerText.includes('supino') ||
      lowerText.includes('costas') ||
      lowerText.includes('remada') ||
      lowerText.includes('barra fixa') ||
      lowerText.includes('pulldown') ||
      lowerText.includes('ombro') ||
      lowerText.includes('desenvolvimento') ||
      lowerText.includes('elevação lateral') ||
      lowerText.includes('bíceps') ||
      lowerText.includes('rosca') ||
      lowerText.includes('tríceps') ||
      lowerText.includes('trícep') ||
      lowerText.includes('mergulho') ||
      lowerText.includes('crucifixo')
    ) {
      return 'superior';
    }

    // Inferior
    if (
      lowerText.includes('perna') ||
      lowerText.includes('agachamento') ||
      lowerText.includes('leg press') ||
      lowerText.includes('cadeira') ||
      lowerText.includes('extensora') ||
      lowerText.includes('flexora') ||
      lowerText.includes('panturrilha') ||
      lowerText.includes('glúteo') ||
      lowerText.includes('coxa') ||
      lowerText.includes('stiff') ||
      lowerText.includes('afundo')
    ) {
      return 'inferior';
    }

    // Cardio
    if (
      lowerText.includes('cardio') ||
      lowerText.includes('corrida') ||
      lowerText.includes('esteira') ||
      lowerText.includes('bike') ||
      lowerText.includes('bicicleta') ||
      lowerText.includes('elíptico') ||
      lowerText.includes('transport') ||
      lowerText.includes('burpee') ||
      lowerText.includes('pular corda')
    ) {
      return 'cardio';
    }

    // Core
    if (
      lowerText.includes('abdominal') ||
      lowerText.includes('abdomen') ||
      lowerText.includes('prancha') ||
      lowerText.includes('plank') ||
      lowerText.includes('core') ||
      lowerText.includes('lombar')
    ) {
      return 'core';
    }

    return 'geral';
  };

  const extractSeriesReps = (text: string): { series?: string; reps?: string; rest?: string; cardioTime?: string; bpm?: string; cleanText: string } => {
    // Procura por padrões: 3x12, 4 x 15, 3 séries de 12 reps, etc
    const seriesRepsMatch = text.match(/(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)/);

    let cleanText = text;
    const result: { series?: string; reps?: string; rest?: string; cardioTime?: string; bpm?: string; cleanText: string } = { cleanText };

    if (seriesRepsMatch) {
      result.series = seriesRepsMatch[1];
      result.reps = seriesRepsMatch[2];
      cleanText = cleanText.replace(seriesRepsMatch[0], '').trim();
    } else {
      const seriesMatch = text.match(/(\d+)\s*séries?/i);
      const repsMatch = text.match(/(\d+(?:-\d+)?)\s*rep(?:s|etições?)?/i);

      if (seriesMatch) {
        result.series = seriesMatch[1];
        cleanText = cleanText.replace(seriesMatch[0], '').trim();
      }

      if (repsMatch) {
        result.reps = repsMatch[1];
        cleanText = cleanText.replace(repsMatch[0], '').trim();
      }
    }

    // Detectar tempo de cardio: 45m, 30m, 20min, etc (para cardio)
    const cardioTimeMatch = cleanText.match(/\b(\d+)\s*m(?:in)?(?:utos?)?\b/i);
    if (cardioTimeMatch) {
      result.cardioTime = `${cardioTimeMatch[1]}m`;
      cleanText = cleanText.replace(cardioTimeMatch[0], '').trim();
    }

    // Detectar BPM: 120bpm, 140 bpm, etc
    const bpmMatch = cleanText.match(/\b(\d+)\s*bpm\b/i);
    if (bpmMatch) {
      result.bpm = `${bpmMatch[1]}bpm`;
      cleanText = cleanText.replace(bpmMatch[0], '').trim();
    }

    // Detectar tempo de descanso: 30s, 60s, 90s, etc
    const restMatch = cleanText.match(/(\d+)\s*(s|seg|segundos?)\b/i);
    if (restMatch) {
      result.rest = `${restMatch[1]}s`;
      cleanText = cleanText.replace(restMatch[0], '').trim();
    }

    result.cleanText = cleanText;
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
      const extracted = extractSeriesReps(currentText);

      const item: ParsedItem = {
        category,
        text: extracted.cleanText,
        series: extracted.series,
        reps: extracted.reps,
        rest: extracted.rest,
        cardioTime: extracted.cardioTime,
        bpm: extracted.bpm,
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

      // Identifica títulos de seções (dias, treinos, etc)
      if (
        line.match(/^(treino|dia|segunda|terça|quarta|quinta|sexta|sábado|domingo)/i) ||
        line.match(/^[A-Z]$/) || // Treino A, B, C
        line.match(/^[-*]\s*(treino|dia)/i)
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
          title: 'Informações Gerais',
          items: [],
        };
      }

      // Processa alternativas
      if (line.toLowerCase().startsWith('ou ')) {
        const cleanLine = line.replace(/^ou\s+/i, '').trim();
        if (cleanLine) {
          const category = categorizeItem(cleanLine);
          const extracted = extractSeriesReps(cleanLine);

          pendingAlternatives.push({
            category,
            text: extracted.cleanText,
            series: extracted.series,
            reps: extracted.reps,
            rest: extracted.rest,
            cardioTime: extracted.cardioTime,
            bpm: extracted.bpm,
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
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {(item.series || item.reps) && (
                              <span className="inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded">
                                {item.series && item.reps ? `${item.series}x${item.reps}` : item.series ? `${item.series} séries` : `${item.reps} reps`}
                              </span>
                            )}
                            {item.rest && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-xs font-semibold text-cyan-700 dark:text-cyan-300 rounded">
                                <Clock size={12} />
                                {item.rest}
                              </span>
                            )}
                            {item.cardioTime && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-300 rounded">
                                <Clock size={12} />
                                {item.cardioTime}
                              </span>
                            )}
                            {item.bpm && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-xs font-semibold text-red-700 dark:text-red-300 rounded">
                                <Heart size={12} />
                                {item.bpm}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                              {item.text}
                            </span>
                            {/* Input de carga (apenas para exercícios não-cardio) */}
                            {item.category !== 'cardio' && (
                              <div className="flex items-center gap-2">
                                <Weight size={14} className="text-gray-500" />
                                <input
                                  type="number"
                                  placeholder="kg"
                                  value={cargas[`${sectionIndex}-${itemIndex}`] || ''}
                                  onChange={(e) => setCargas({ ...cargas, [`${sectionIndex}-${itemIndex}`]: e.target.value })}
                                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                              </div>
                            )}
                          </div>
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
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {(alt.series || alt.reps) && (
                                    <span className="inline-block px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded">
                                      {alt.series && alt.reps ? `${alt.series}x${alt.reps}` : alt.series ? `${alt.series} séries` : `${alt.reps} reps`}
                                    </span>
                                  )}
                                  {alt.rest && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-xs font-semibold text-cyan-700 dark:text-cyan-300 rounded">
                                      <Clock size={12} />
                                      {alt.rest}
                                    </span>
                                  )}
                                  {alt.cardioTime && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-300 rounded">
                                      <Clock size={12} />
                                      {alt.cardioTime}
                                    </span>
                                  )}
                                  {alt.bpm && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-xs font-semibold text-red-700 dark:text-red-300 rounded">
                                      <Heart size={12} />
                                      {alt.bpm}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                                    {alt.text}
                                  </span>
                                  {/* Input de carga para alternativa (apenas não-cardio) */}
                                  {alt.category !== 'cardio' && (
                                    <div className="flex items-center gap-2">
                                      <Weight size={14} className="text-gray-500" />
                                      <input
                                        type="number"
                                        placeholder="kg"
                                        value={cargas[`${sectionIndex}-${itemIndex}-alt-${altIndex}`] || ''}
                                        onChange={(e) => setCargas({ ...cargas, [`${sectionIndex}-${itemIndex}-alt-${altIndex}`]: e.target.value })}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      />
                                    </div>
                                  )}
                                </div>
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
