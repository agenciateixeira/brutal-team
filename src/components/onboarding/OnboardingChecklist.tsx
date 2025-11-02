'use client';

import { useState, useEffect } from 'react';
import { Check, X, Bell, UtensilsCrossed, Dumbbell, ClipboardList, User } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  completed: boolean;
  link?: string;
}

interface OnboardingChecklistProps {
  hasDieta: boolean;
  hasTreino: boolean;
  hasProtocolo: boolean;
  hasProfile: boolean;
}

export default function OnboardingChecklist({
  hasDieta,
  hasTreino,
  hasProtocolo,
  hasProfile,
}: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { isSubscribed } = usePushNotifications();
  const router = useRouter();

  const items: ChecklistItem[] = [
    {
      id: 'notifications',
      label: 'Ativar Notificações',
      description: 'Receba alertas das atualizações',
      icon: Bell,
      completed: isSubscribed,
      link: '/aluno/perfil',
    },
    {
      id: 'dieta',
      label: 'Visualizar Dieta',
      description: 'Confira seu plano alimentar',
      icon: UtensilsCrossed,
      completed: hasDieta,
      link: '/aluno/dieta',
    },
    {
      id: 'treino',
      label: 'Visualizar Treino',
      description: 'Veja seus exercícios',
      icon: Dumbbell,
      completed: hasTreino,
      link: '/aluno/treino',
    },
    {
      id: 'protocolo',
      label: 'Visualizar Protocolo',
      description: 'Confira seus suplementos',
      icon: ClipboardList,
      completed: hasProtocolo,
      link: '/aluno/protocolo',
    },
    {
      id: 'profile',
      label: 'Completar Perfil',
      description: 'Adicione suas informações',
      icon: User,
      completed: hasProfile,
      link: '/aluno/perfil',
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;
  const isCompleted = completedCount === totalCount;

  // Se tudo completado, esconder depois de 3 segundos
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // Verificar se usuário já fechou o checklist
  useEffect(() => {
    const dismissed = localStorage.getItem('onboarding-checklist-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('onboarding-checklist-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 rounded-xl border border-white/60 dark:border-gray-700/60 p-6 shadow-2xl shadow-primary-500/10 animate-in slide-in-from-top duration-500 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/80 before:to-white/20 dark:before:from-gray-800/80 dark:before:to-gray-900/20 before:-z-10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {isCompleted ? '🎉 Tudo Pronto!' : '👋 Complete seu Setup'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isCompleted
              ? 'Você está pronto para sua jornada de transformação!'
              : 'Configure sua conta para aproveitar ao máximo a plataforma'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Progresso
          </span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/60 dark:border-gray-600/60">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-500 ease-out shadow-lg shadow-primary-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.link && router.push(item.link)}
              disabled={item.completed}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                item.completed
                  ? 'bg-green-500/20 dark:bg-green-400/20 backdrop-blur-sm border-green-400/60 dark:border-green-400/60'
                  : 'bg-white/60 dark:bg-gray-700/40 backdrop-blur-md border-white/80 dark:border-gray-600/60 hover:bg-white/80 dark:hover:bg-gray-700/60 hover:border-primary-400/60 dark:hover:border-primary-500/60 hover:scale-102 hover:shadow-lg hover:shadow-primary-500/20 cursor-pointer'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon/Check */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.completed
                    ? 'bg-green-500'
                    : 'bg-primary-100 dark:bg-primary-900/30'
                }`}
              >
                {item.completed ? (
                  <Check size={20} className="text-white" />
                ) : (
                  <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <p
                  className={`font-semibold ${
                    item.completed
                      ? 'text-green-700 dark:text-green-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Message */}
      {!isCompleted && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-sm border border-blue-400/30 dark:border-blue-400/30">
          <p className="text-xs text-center text-gray-900 dark:text-white">
            💡 <strong>Dica:</strong> Comece ativando as notificações para não perder nenhuma atualização!
          </p>
        </div>
      )}
    </div>
  );
}
