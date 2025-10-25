'use client';

import { useRouter } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';

export function useNavigateWithLoading() {
  const router = useRouter();
  const { showLoading } = useLoading();

  const navigate = (path: string, message = 'Carregando...') => {
    showLoading(message);
    router.push(path);
  };

  return { navigate };
}
