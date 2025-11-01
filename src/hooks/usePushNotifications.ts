'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Converter base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Detectar tipo de dispositivo
function getDeviceType(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  }
  return 'desktop';
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Verificar suporte
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (supported && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Verificar se já está inscrito
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Erro ao verificar subscription:', err);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Solicitar permissão
  const requestPermission = async () => {
    if (!isSupported) {
      setError('Push notifications não são suportadas neste navegador');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'denied') {
        setError('Permissão negada. Você pode alterar isso nas configurações do navegador.');
      } else if (result === 'granted') {
        // Automaticamente inscrever após permissão
        await subscribe();
      }
    } catch (err: any) {
      console.error('Erro ao solicitar permissão:', err);
      setError(err.message || 'Erro ao solicitar permissão');
    } finally {
      setIsLoading(false);
    }
  };

  // Inscrever para notificações push
  const subscribe = async () => {
    if (!isSupported) {
      setError('Push notifications não são suportadas neste navegador');
      return;
    }

    if (permission !== 'granted') {
      setError('Permissão não concedida');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;

      // Verificar se já existe subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Criar nova subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key não configurada');
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // Salvar subscription no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const subscriptionData = subscription.toJSON();

      const { error: saveError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh!,
          auth: subscriptionData.keys!.auth!,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          is_active: true,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (saveError) throw saveError;

      setIsSubscribed(true);
      console.log('Push notification inscrita com sucesso!');

    } catch (err: any) {
      console.error('Erro ao inscrever para push:', err);
      setError(err.message || 'Erro ao inscrever para notificações');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Desinscrever de notificações push
  const unsubscribe = async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remover do Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const subscriptionData = subscription.toJSON();
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscriptionData.endpoint!);
        }
      }

      setIsSubscribed(false);
      console.log('Push notification desinscrita com sucesso!');

    } catch (err: any) {
      console.error('Erro ao desinscrever:', err);
      setError(err.message || 'Erro ao desinscrever');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
