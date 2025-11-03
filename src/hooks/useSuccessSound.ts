'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook para tocar sons de sucesso/celebração estilo Duolingo
 * Usa Web Audio API para gerar sons sintéticos
 */
export function useSuccessSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializar AudioContext apenas quando necessário
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Toca som de sucesso para refeições
   * Som suave e agradável: notas ascendentes
   */
  const playMealSuccess = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;

      // Criar oscilador e ganho
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Som de sino suave: 3 notas ascendentes
      oscillator.type = 'sine';

      // Melodia: C5 -> E5 -> G5 (acorde de dó maior)
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.08); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.16); // G5

      // Envelope ADSR suave
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.15, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.4);

    } catch (error) {
      console.warn('Erro ao tocar som de refeição:', error);
    }
  }, [getAudioContext]);

  /**
   * Toca som de sucesso para treinos
   * Som mais energético e motivador: fanfarra de conquista
   */
  const playWorkoutSuccess = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;

      // Criar múltiplos osciladores para um som mais rico
      const createNote = (frequency: number, startTime: number, duration: number, volume: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Fanfarra de conquista: C5 -> E5 -> G5 -> C6 (acorde expandido)
      createNote(523.25, now, 0.15, 0.25); // C5
      createNote(659.25, now + 0.08, 0.15, 0.25); // E5
      createNote(783.99, now + 0.16, 0.2, 0.3); // G5
      createNote(1046.50, now + 0.24, 0.3, 0.35); // C6 (oitava acima)

      // Adicionar harmônico para dar mais corpo
      createNote(523.25 * 2, now + 0.24, 0.2, 0.15); // Harmônico C6

    } catch (error) {
      console.warn('Erro ao tocar som de treino:', error);
    }
  }, [getAudioContext]);

  /**
   * Toca som de desmarcar (sutil e discreto)
   */
  const playUncheckSound = useCallback(() => {
    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Som descendente muito sutil
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(300, now + 0.1);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      oscillator.start(now);
      oscillator.stop(now + 0.1);

    } catch (error) {
      console.warn('Erro ao tocar som de desmarcar:', error);
    }
  }, [getAudioContext]);

  return {
    playMealSuccess,
    playWorkoutSuccess,
    playUncheckSound,
  };
}
