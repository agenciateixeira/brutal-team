'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-600 dark:text-green-400" />,
    error: <XCircle size={20} className="text-red-600 dark:text-red-400" />,
    info: <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-700',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-700',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-700',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${colors[type]} animate-slide-up`}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
        {message}
      </p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
      >
        <X size={16} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
