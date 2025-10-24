'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Só habilitar PWA em produção nos domínios corretos
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedDomains = ['app.brutalteam.blog.br', 'www.app.brutalteam.blog.br'];
    const isCorrectDomain = typeof window !== 'undefined' &&
      allowedDomains.includes(window.location.hostname);

    if (!isProduction || !isCorrectDomain) {
      console.log('PWA desabilitado. Ambiente:', process.env.NODE_ENV, 'Domínio:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
      return;
    }

    // Detectar plataforma
    const userAgent = navigator.userAgent || navigator.vendor;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/i.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Verificar se já foi instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('✅ PWA já está instalado');
      return;
    }

    // Verificar se já recusou
    const hasDeclined = localStorage.getItem('pwa-install-declined');

    // Em mobile, mostrar banner manual após 3 segundos se não tiver recusado
    if ((isIOSDevice || isAndroidDevice) && !hasDeclined) {
      const timer = setTimeout(() => {
        setShowManualPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
        })
        .catch((error) => {
          console.log('❌ Erro ao registrar Service Worker:', error);
        });
    }

    // Capturar evento de instalação do PWA
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Verificar se já foi instalado ou se o usuário já recusou
      const hasDeclined = localStorage.getItem('pwa-install-declined');
      if (!hasDeclined) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA instalado!');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pwa-install-declined', 'true');
    setShowPrompt(false);
  };

  const handleDeclineManual = () => {
    localStorage.setItem('pwa-install-declined', 'true');
    setShowManualPrompt(false);
  };

  // Banner manual para mobile
  if (showManualPrompt && (isIOS || isAndroid)) {
    return (
      <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
        <button
          onClick={handleDeclineManual}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <Smartphone size={24} className="text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Instalar Brutal Team
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Use nosso app como aplicativo nativo!
            </p>

            {isIOS && (
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium flex items-center gap-2">
                  <Share size={16} className="text-primary-600" />
                  Como instalar no iPhone:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toque no botão <strong>Compartilhar</strong> (ícone ⬆️)</li>
                  <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
                  <li>Toque em <strong>"Adicionar"</strong></li>
                </ol>
              </div>
            )}

            {isAndroid && (
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="font-medium flex items-center gap-2">
                  <Download size={16} className="text-primary-600" />
                  Como instalar no Android:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toque nos <strong>3 pontinhos</strong> (menu)</li>
                  <li>Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                  <li>Confirme a instalação</li>
                </ol>
              </div>
            )}

            <button
              onClick={handleDeclineManual}
              className="mt-3 w-full px-4 py-2 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Talvez depois
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDecline}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
          <Download size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Instalar Brutal Team
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Instale nosso app para acesso rápido e experiência nativa no seu celular!
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
