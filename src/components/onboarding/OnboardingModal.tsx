'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Bell, UtensilsCrossed, Dumbbell, ClipboardList, LayoutDashboard, Check } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    id: 1,
    icon: Bell,
    title: 'Ative as Notificações!',
    description: 'Receba alertas instantâneos quando seu coach atualizar sua dieta, treino ou protocolo.',
    color: 'bg-blue-500',
    iconColor: 'text-blue-500',
    features: [
      'Nova dieta disponível',
      'Novo treino disponível',
      'Novo protocolo disponível',
    ],
    hasNotificationButton: true,
  },
  {
    id: 2,
    icon: UtensilsCrossed,
    title: 'Sua Dieta Personalizada',
    description: 'Acesse seu plano alimentar completo criado exclusivamente para você pelo seu coach.',
    color: 'bg-green-500',
    iconColor: 'text-green-500',
    features: [
      'Refeições detalhadas',
      'Horários sugeridos',
      'Observações nutricionais',
    ],
  },
  {
    id: 3,
    icon: Dumbbell,
    title: 'Seu Treino Personalizado',
    description: 'Veja todos os exercícios, séries e repetições do seu plano de treino.',
    color: 'bg-orange-500',
    iconColor: 'text-orange-500',
    features: [
      'Exercícios detalhados',
      'Séries e repetições',
      'Observações importantes',
    ],
  },
  {
    id: 4,
    icon: ClipboardList,
    title: 'Protocolo de Suplementação',
    description: 'Acompanhe os suplementos recomendados e horários de uso.',
    color: 'bg-purple-500',
    iconColor: 'text-purple-500',
    features: [
      'Suplementos recomendados',
      'Dosagem e horários',
      'Orientações do coach',
    ],
  },
  {
    id: 5,
    icon: LayoutDashboard,
    title: 'Tudo Pronto!',
    description: 'Você está pronto para começar sua jornada de transformação com o Brutal Team.',
    color: 'bg-primary-500',
    iconColor: 'text-primary-500',
    features: [
      'Dashboard com resumo semanal',
      'Acompanhe seu progresso',
      'Comunique-se com seu coach',
    ],
  },
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { requestPermission, subscribe, permission, isSubscribed, isLoading } = usePushNotifications();

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleActivateNotifications = async () => {
    if (permission === 'granted' && !isSubscribed) {
      await subscribe();
    } else {
      await requestPermission();
    }

    // Avançar para próximo slide após ativar
    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-8 sm:p-12">
          {/* Icon */}
          <div className={`w-20 h-20 ${slide.color} rounded-2xl flex items-center justify-center mb-6 mx-auto animate-in zoom-in duration-500`}>
            <Icon size={40} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4 animate-in slide-in-from-bottom duration-500">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-8 animate-in slide-in-from-bottom duration-500 delay-100">
            {slide.description}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {slide.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
              >
                <div className={`w-6 h-6 ${slide.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Check size={16} className="text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Notification Button (only on first slide) */}
          {slide.hasNotificationButton && (
            <div className="mb-8 animate-in slide-in-from-bottom duration-500 delay-300">
              {!isSubscribed ? (
                <button
                  onClick={handleActivateNotifications}
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Bell size={20} />
                  {isLoading ? 'Ativando...' : 'Ativar Notificações Agora'}
                </button>
              ) : (
                <div className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                  <Check size={20} />
                  Notificações Ativadas!
                </div>
              )}
            </div>
          )}

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? `${slide.color} w-8`
                    : 'bg-gray-300 dark:bg-gray-600 w-2'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-3 ${slide.color} hover:opacity-90 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105`}
              >
                Próximo
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-3 ${slide.color} hover:opacity-90 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105`}
              >
                Começar!
                <Check size={20} />
              </button>
            )}
          </div>

          {/* Skip */}
          {currentSlide < slides.length - 1 && (
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Pular tutorial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
