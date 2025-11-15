'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FirstAccessModal from './FirstAccessModal';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

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
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [firstAccessCompleted, setFirstAccessCompleted] = useState(initialFirstAccessCompleted);
  const supabase = createClient();

  useEffect(() => {
    // Mostrar modal de primeiro acesso se ainda não foi completo
    if (!firstAccessCompleted) {
      setShowFirstAccessModal(true);
    } else {
      // Se primeiro acesso completo, verificar se já viu o onboarding
      const onboardingSeen = localStorage.getItem('onboarding-seen');
      if (!onboardingSeen) {
        setShowOnboardingModal(true);
      }
    }
  }, [firstAccessCompleted]);

  const handleFirstAccessComplete = () => {
    setShowFirstAccessModal(false);
    setFirstAccessCompleted(true);

    // Mostrar onboarding após completar primeiro acesso
    setTimeout(() => {
      setShowOnboardingModal(true);
    }, 500);
  };

  const handleOnboardingClose = () => {
    setShowOnboardingModal(false);
    localStorage.setItem('onboarding-seen', 'true');
  };

  return (
    <>
      {children}
      {showFirstAccessModal && <FirstAccessModal alunoId={alunoId} onComplete={handleFirstAccessComplete} />}
      {showOnboardingModal && <OnboardingModal isOpen={showOnboardingModal} onClose={handleOnboardingClose} />}
    </>
  );
}
