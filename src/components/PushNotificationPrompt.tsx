'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, X } from 'lucide-react';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
  } = usePushNotifications();

  // Verificar se deve mostrar o prompt
  useEffect(() => {
    // Aguardar 3 segundos após o carregamento da página
    const timer = setTimeout(() => {
      // Verificar se já foi dispensado
      const wasDismissed = localStorage.getItem('push-notification-dismissed');

      // Mostrar apenas se:
      // - Suportado pelo navegador
      // - Permissão ainda não foi concedida ou negada
      // - Não está inscrito
      // - Não foi dispensado anteriormente
      if (
        isSupported &&
        permission === 'default' &&
        !isSubscribed &&
        !wasDismissed
      ) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSupported, permission, isSubscribed]);

  const handleAccept = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Guardar que foi dispensado (por 7 dias)
    localStorage.setItem('push-notification-dismissed', Date.now().toString());
  };

  // Não mostrar se não deve aparecer
  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-primary-500 p-4">
        {/* Botão fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Ícone e título */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ativar Notificações
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Receba notificações quando seu coach atualizar sua dieta, treino ou protocolo
            </p>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Bell size={18} />
            {isLoading ? 'Ativando...' : 'Ativar'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Agora não
          </button>
        </div>

        {/* Informação adicional */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Você pode desativar as notificações a qualquer momento nas configurações
        </p>
      </div>
    </div>
  );
}
