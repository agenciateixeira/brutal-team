'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from './LoadingProvider';

export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hideLoading } = useLoading();

  useEffect(() => {
    // Esconder loading quando a rota terminar de carregar
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return <>{children}</>;
}
