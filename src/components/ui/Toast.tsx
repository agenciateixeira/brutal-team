'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-600 dark:text-green-400" />,
    error: <XCircle size={20} className="text-red-600 dark:text-red-400" />,
    info: <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-100',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border-l-4 ${colors[type]} ${
        isExiting ? 'animate-fadeOut' : 'animate-slideIn'
      }`}
      style={{
        minWidth: '300px',
        maxWidth: '500px',
        animation: isExiting ? 'fadeOut 0.3s ease-out forwards' : undefined,
      }}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium">
        {message}
      </p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        aria-label="Fechar"
      >
        <X size={16} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
}
