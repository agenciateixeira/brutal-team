'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

/**
 * Componente de Pull-to-Refresh (arrastar para baixo para atualizar)
 * Funciona igual Instagram, WhatsApp e outros apps mobile
 */
export default function PullToRefresh() {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const router = useRouter();
  const pullThreshold = 150; // Distância para ativar refresh
  const minActivationDistance = 120; // MUITO AUMENTADO: Precisa puxar 120px antes do indicador aparecer
  const minPullSpeed = 1.0; // MUITO AUMENTADO: Precisa ser uma puxada RÁPIDA e intencional
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // APENAS ativa se estiver EXATAMENTE no topo da página
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setStartTime(Date.now());
        setIsPulling(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || startTime === 0) return;

      const currentTouchY = e.touches[0].clientY;
      const pullDistance = currentTouchY - startY;

      // APENAS ativa pull se:
      // 1. Estiver puxando para BAIXO (pullDistance > 0)
      // 2. Estiver NO TOPO da página (scrollY === 0)
      // 3. Já puxou pelo menos 80px (evita ativação acidental durante scroll)
      if (pullDistance > minActivationDistance && window.scrollY === 0) {
        setCurrentY(currentTouchY);
        setIsPulling(true);

        // Prevenir scroll enquanto está puxando com força
        if (pullDistance > minActivationDistance + 20) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || startTime === 0) {
        setStartY(0);
        setCurrentY(0);
        setStartTime(0);
        return;
      }

      const pullDistance = currentY - startY;
      const pullDuration = Date.now() - startTime;
      const pullSpeed = pullDistance / pullDuration; // pixels por ms

      // Só ativa refresh se:
      // 1. Puxou pelo menos 120px (threshold)
      // 2. Com velocidade mínima (não foi arrasto lento acidental)
      // 3. Ainda está no topo
      if (pullDistance >= pullThreshold && pullSpeed >= minPullSpeed && window.scrollY === 0) {
        setIsRefreshing(true);

        // Aguardar um pouco para mostrar a animação
        await new Promise(resolve => setTimeout(resolve, 300));

        // Recarregar a página atual
        router.refresh();

        // Aguardar mais um pouco antes de esconder o indicador
        await new Promise(resolve => setTimeout(resolve, 800));

        setIsRefreshing(false);
      }

      // Reset
      setStartY(0);
      setCurrentY(0);
      setStartTime(0);
      setIsPulling(false);
    };

    // Adicionar listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, currentY, isPulling, startTime, router]);

  // Calcular a distância puxada
  const pullDistance = isPulling ? Math.min(currentY - startY, pullThreshold * 1.5) : 0;
  const pullProgress = Math.min(pullDistance / pullThreshold, 1);
  const showIndicator = isPulling || isRefreshing;

  // Funcionalidade de refresh mantida, mas SEM indicador visual
  return null;
}
