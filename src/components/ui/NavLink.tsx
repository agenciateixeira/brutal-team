'use client';

import Link from 'next/link';
import { useLoading } from '@/components/providers/LoadingProvider';
import { ReactNode, useState } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  onClick?: () => void;
  disableLoading?: boolean;
}

export default function NavLink({
  href,
  children,
  className = '',
  loadingMessage = 'Carregando...',
  onClick,
  disableLoading = false,
}: NavLinkProps) {
  const { showLoading } = useLoading();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Iniciar transição suave
    setIsTransitioning(true);

    // Pequeno delay antes de mostrar o loading (se não estiver desabilitado)
    setTimeout(() => {
      if (!disableLoading) {
        showLoading(loadingMessage);
      }
      if (onClick) {
        onClick();
      }
    }, 150);
  };

  return (
    <Link
      href={href}
      className={`${className} transition-opacity duration-150 ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
