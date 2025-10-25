'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Apple, User, Heart } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  isFadingOut?: boolean;
}

const loadingIcons = [
  { Icon: Dumbbell, label: 'Treino', color: 'text-primary-500' },
  { Icon: Apple, label: 'Nutrição', color: 'text-green-500' },
  { Icon: User, label: 'Atleta', color: 'text-blue-500' },
  { Icon: Heart, label: 'Saúde', color: 'text-red-500' },
];

export default function LoadingScreen({ message = 'Carregando...', isFadingOut = false }: LoadingScreenProps) {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % loadingIcons.length);
    }, 800); // Alterna a cada 800ms

    return () => clearInterval(interval);
  }, []);

  const currentIcon = loadingIcons[currentIconIndex];
  const Icon = currentIcon.Icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 via-transparent to-blue-100/20 animate-pulse" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Icon container with rotation animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 -m-4">
            <div className="w-32 h-32 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>

          {/* Icon with fade animation */}
          <div
            key={currentIconIndex}
            className="w-24 h-24 flex items-center justify-center bg-gray-50 backdrop-blur-sm rounded-full shadow-lg animate-fadeIn"
          >
            <Icon
              size={48}
              className={`${currentIcon.color} animate-pulse`}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-900 animate-pulse">
            {message}
          </h3>
          <p className="text-sm text-gray-600 animate-fadeIn">
            {currentIcon.label}
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
