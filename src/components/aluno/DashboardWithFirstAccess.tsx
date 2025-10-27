'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FirstAccessModal from './FirstAccessModal';

interface DashboardWithFirstAccessProps {
  alunoId: string;
  initialFirstAccessCompleted: boolean;
  children: React.ReactNode;
}

export default function DashboardWithFirstAccess({
  alunoId,
  initialFirstAccessCompleted,
  children,
}: DashboardWithFirstAccessProps) {
  const [showModal, setShowModal] = useState(false);
  const [firstAccessCompleted, setFirstAccessCompleted] = useState(initialFirstAccessCompleted);
  const supabase = createClient();

  useEffect(() => {
    // Mostrar modal se o primeiro acesso não foi completo
    if (!firstAccessCompleted) {
      setShowModal(true);
    }
  }, [firstAccessCompleted]);

  const handleComplete = () => {
    setShowModal(false);
    setFirstAccessCompleted(true);
  };

  return (
    <>
      {children}
      {showModal && <FirstAccessModal alunoId={alunoId} onComplete={handleComplete} />}
    </>
  );
}
