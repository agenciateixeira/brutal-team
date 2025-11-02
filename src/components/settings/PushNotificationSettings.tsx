'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Se não é suportado, não mostrar nada
  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Bell className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notificações Push
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Receba notificações de atualizações importantes
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-medium flex items-center gap-2 ${
              isSubscribed ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isSubscribed ? (
                <>
                  <CheckCircle size={16} />
                  Ativadas
                </>
              ) : (
                <>
                  <BellOff size={16} />
                  Desativadas
                </>
              )}
            </span>
          </div>
          {permission && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Permissão:</span>
              <span className={`font-medium ${
                permission === 'granted' ? 'text-green-600' :
                permission === 'denied' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {permission === 'granted' ? 'Concedida' :
                 permission === 'denied' ? 'Negada' :
                 'Pendente'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!isSubscribed && permission !== 'granted' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={20} />
            {isLoading ? 'Processando...' : 'Ativar Notificações'}
          </button>
        )}

        {!isSubscribed && permission === 'granted' && (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={20} />
            {isLoading ? 'Processando...' : 'Inscrever para Notificações'}
          </button>
        )}

        {isSubscribed && (
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BellOff size={20} />
            {isLoading ? 'Processando...' : 'Desativar Notificações'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          💡 <strong>Dica:</strong> Com as notificações ativadas, você receberá alertas instantâneos quando seu coach atualizar sua dieta, treino ou protocolo.
        </p>
      </div>
    </div>
  );
}
