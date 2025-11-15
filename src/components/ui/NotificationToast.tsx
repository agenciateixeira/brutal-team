'use client';

import { useEffect, useState } from 'react';
import { X, Bell, Apple, Dumbbell, FileText, MessageCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/hooks/useNotifications';

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;

      // Adiciona notificação
      setNotifications((prev) => [...prev, notification]);

      // Remove após 5 segundos
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    window.addEventListener('show-notification' as any, handleNotification);

    return () => {
      window.removeEventListener('show-notification' as any, handleNotification);
    };
  }, []);

  const getIcon = (type: string, iconName?: string) => {
    if (iconName === 'Apple') return <Apple size={20} className="text-green-600" />;
    if (iconName === 'Dumbbell') return <Dumbbell size={20} className="text-blue-600" />;
    if (iconName === 'FileText') return <FileText size={20} className="text-purple-600" />;

    switch (type) {
      case 'dieta':
        return <Apple size={20} className="text-green-600" />;
      case 'treino':
        return <Dumbbell size={20} className="text-blue-600" />;
      case 'protocolo':
        return <FileText size={20} className="text-purple-600" />;
      case 'mensagem':
        return <MessageCircle size={20} className="text-orange-600" />;
      default:
        return <Info size={20} className="text-gray-600" />;
    }
  };

  const handleClick = (notification: Notification) => {
    if (notification.link) {
      router.push(notification.link);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
  };

  const handleClose = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full px-4 md:px-0">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleClick(notification)}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-xl transition-all animate-slideIn flex items-start gap-3"
        >
          {/* Ícone */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type, notification.icon)}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {notification.title}
              </h4>
              <button
                onClick={(e) => handleClose(notification.id, e)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
