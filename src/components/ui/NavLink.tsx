'use client';

import Link from 'next/link';
import { useLoading } from '@/components/providers/LoadingProvider';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  onClick?: () => void;
}

export default function NavLink({
  href,
  children,
  className = '',
  loadingMessage = 'Carregando...',
  onClick,
}: NavLinkProps) {
  const { showLoading } = useLoading();

  const handleClick = () => {
    showLoading(loadingMessage);
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
