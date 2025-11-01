// Helper para enviar push notifications via Supabase Edge Function

import { createClient } from '@/lib/supabase/client';

export interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(params: SendPushParams) {
  const supabase = createClient();

  try {
    // Chamar a Edge Function
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        icon: params.icon || '/icon-192x192.png',
        badge: params.badge || '/icon-192x192.png',
        url: params.url || '/',
        data: params.data || {},
      },
    });

    if (error) {
      console.error('Erro ao enviar push notification:', error);
      throw error;
    }

    console.log('Push notification enviada:', data);
    return data;
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    throw error;
  }
}

// Helper específico para notificar atualização de dieta
export async function notifyDietaUpdate(alunoId: string, dietaTitle: string) {
  return sendPushNotification({
    userId: alunoId,
    title: 'Nova dieta disponível! 🍽️',
    body: `Seu coach atualizou sua dieta: ${dietaTitle}`,
    icon: '/icon-192x192.png',
    url: '/aluno/dieta',
    data: {
      type: 'dieta',
      action: 'update',
    },
  });
}

// Helper específico para notificar atualização de treino
export async function notifyTreinoUpdate(alunoId: string, treinoTitle: string) {
  return sendPushNotification({
    userId: alunoId,
    title: 'Novo treino disponível! 💪',
    body: `Seu coach atualizou seu treino: ${treinoTitle}`,
    icon: '/icon-192x192.png',
    url: '/aluno/treino',
    data: {
      type: 'treino',
      action: 'update',
    },
  });
}

// Helper específico para notificar atualização de protocolo
export async function notifyProtocoloUpdate(alunoId: string, protocoloTitle: string) {
  return sendPushNotification({
    userId: alunoId,
    title: 'Novo protocolo disponível! 📋',
    body: `Seu coach atualizou seu protocolo: ${protocoloTitle}`,
    icon: '/icon-192x192.png',
    url: '/aluno/protocolo',
    data: {
      type: 'protocolo',
      action: 'update',
    },
  });
}
