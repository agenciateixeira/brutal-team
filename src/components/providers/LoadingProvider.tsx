'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const MIN_LOADING_TIME = 3000; // 3 segundos mínimo

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Carregando...');
  const loadingStartTime = useRef<number>(0);

  const showLoading = useCallback((msg = 'Carregando...') => {
    setMessage(msg);
    setIsLoading(true);
    loadingStartTime.current = Date.now();
  }, []);

  const hideLoading = useCallback(() => {
    const elapsedTime = Date.now() - loadingStartTime.current;
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

    // Garantir que o loading fique visível pelo tempo mínimo
    setTimeout(() => {
      setIsLoading(false);
    }, remainingTime);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingScreen message={message} />}
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
