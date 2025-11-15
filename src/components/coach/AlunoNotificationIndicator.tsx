'use client';

interface NotificationIndicatorProps {
  hasPhoto: boolean;
  hasMessage: boolean;
  hasAll: boolean; // tem todas as notificações (photo, message, diet, workout, protocol)
}

export default function AlunoNotificationIndicator({
  hasPhoto,
  hasMessage,
  hasAll
}: NotificationIndicatorProps) {

  // Bolinha vermelha: todos os campos atualizados
  if (hasAll) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
        <div
          className="w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"
          title="Todos os campos atualizados"
        />
      </div>
    );
  }

  // Bolinha verde + azul: resumo + mensagens
  if (hasPhoto && hasMessage) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
        <div
          className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
          title="Resumo semanal atualizado"
        />
        <div
          className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"
          title="Novas mensagens"
        />
      </div>
    );
  }

  // Bolinha verde: apenas resumo semanal
  if (hasPhoto) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
        <div
          className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
          title="Resumo semanal atualizado"
        />
      </div>
    );
  }

  // Bolinha azul: apenas mensagens
  if (hasMessage) {
    return (
      <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
        <div
          className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"
          title="Novas mensagens"
        />
      </div>
    );
  }

  return null;
}
