'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface LoadingContextType {
  showLoading: (message?: string, minTime?: number) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const DEFAULT_MIN_TIME = 3000; // 3 segundos para login/cadastro
const NAVIGATION_MIN_TIME = 300; // 300ms para navegação interna (instantâneo)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [message, setMessage] = useState('Carregando...');
  const loadingStartTime = useRef<number>(0);
  const minLoadingTime = useRef<number>(DEFAULT_MIN_TIME);

  const showLoading = useCallback((msg = 'Carregando...', minTime = NAVIGATION_MIN_TIME) => {
    setMessage(msg);
    setIsLoading(true);
    setIsFadingOut(false);
    loadingStartTime.current = Date.now();
    minLoadingTime.current = minTime;
  }, []);

  const hideLoading = useCallback(() => {
    const elapsedTime = Date.now() - loadingStartTime.current;
    const remainingTime = Math.max(0, minLoadingTime.current - elapsedTime);

    // Garantir que o loading fique visível pelo tempo mínimo
    setTimeout(() => {
      // Iniciar fade out
      setIsFadingOut(true);

      // Remover loading após a animação de fade
      setTimeout(() => {
        setIsLoading(false);
        setIsFadingOut(false);
      }, 150); // Duração do fade-out (rápido)
    }, remainingTime);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingScreen message={message} isFadingOut={isFadingOut} />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
