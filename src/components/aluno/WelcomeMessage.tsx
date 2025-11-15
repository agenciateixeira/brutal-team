'use client';

import { Clock, Sparkles } from 'lucide-react';

interface WelcomeMessageProps {
  type?: 'dashboard' | 'diet' | 'workout';
}

export default function WelcomeMessage({ type = 'dashboard' }: WelcomeMessageProps) {
  return (
    <div className="bg-gradient-to-br from-primary-50 via-primary-100 to-secondary-50 dark:from-primary-900/20 dark:via-primary-800/20 dark:to-secondary-900/20 rounded-2xl shadow-lg border-2 border-primary-300 dark:border-primary-700 p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="text-white" size={40} />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="text-yellow-400" size={24} />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            EM ATÉ 7 DIAS SEU COACH ENVIARÁ
          </h2>
          <p className="text-xl md:text-2xl font-semibold text-primary-700 dark:text-primary-300 uppercase">
            {type === 'diet' && 'SUA DIETA COMPLETA'}
            {type === 'workout' && 'SEU TREINO COMPLETO'}
            {type === 'dashboard' && 'SEU TREINO, SUA DIETA'}
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
            para começar a sua jornada!
          </p>
        </div>

        {/* Additional info */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-primary-200 dark:border-primary-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nosso time está preparando um plano personalizado especialmente para você.
            Fique de olho nas notificações!
          </p>
        </div>
      </div>
    </div>
  );
}
