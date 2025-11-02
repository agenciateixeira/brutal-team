'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

interface AlertState {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmState {
  title?: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
  resolve: (value: boolean) => void;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showAlert = ({ title, message, type = 'info', duration = 5000 }: AlertOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const alert: AlertState = { id, title, message, type };

    setAlerts((prev) => [...prev, alert]);

    if (duration > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, duration);
    }
  };

  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        resolve,
      });
    });
  };

  const handleConfirm = (value: boolean) => {
    if (confirm) {
      confirm.resolve(value);
      setConfirm(null);
    }
  };

  const getAlertIcon = (type: AlertState['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertStyles = (type: AlertState['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getConfirmStyles = (type: ConfirmState['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-[9999] space-y-2 max-w-md">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`${getAlertStyles(alert.type)} border-2 rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                {alert.title && (
                  <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                )}
                <p className="text-sm">{alert.message}</p>
              </div>
              <button
                onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[9998] animate-in fade-in duration-200"
            onClick={() => handleConfirm(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              {/* Header */}
              {confirm.title && (
                <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {confirm.title}
                  </h2>
                </div>
              )}

              {/* Body */}
              <div className="px-6 py-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {confirm.message}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3 justify-end">
                <button
                  onClick={() => handleConfirm(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  {confirm.cancelText}
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${getConfirmStyles(confirm.type)}`}
                >
                  {confirm.confirmText}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AlertContext.Provider>
  );
}
