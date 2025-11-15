'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Mail, MessageCircle, Trophy, Users, Calendar, Loader2 } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface NotificacoesFormProps {
  userId: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  workout_reminders: boolean;
  meal_reminders: boolean;
  achievement_notifications: boolean;
  community_notifications: boolean;
  coach_messages: boolean;
}

export default function NotificacoesForm({ userId }: NotificacoesFormProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    workout_reminders: true,
    meal_reminders: true,
    achievement_notifications: true,
    community_notifications: true,
    coach_messages: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          workout_reminders: data.workout_reminders ?? true,
          meal_reminders: data.meal_reminders ?? true,
          achievement_notifications: data.achievement_notifications ?? true,
          community_notifications: data.community_notifications ?? true,
          coach_messages: data.coach_messages ?? true,
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (prefs: NotificationPreferences) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...prefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setToast({ type: 'success', message: 'Preferências salvas!' });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const notificationSettings = [
    {
      title: 'Notificações por Email',
      description: 'Receba atualizações importantes por email',
      icon: Mail,
      key: 'email_notifications' as keyof NotificationPreferences,
      color: 'text-blue-600',
    },
    {
      title: 'Notificações Push',
      description: 'Receba notificações em tempo real no navegador',
      icon: Bell,
      key: 'push_notifications' as keyof NotificationPreferences,
      color: 'text-purple-600',
    },
    {
      title: 'Lembretes de Treino',
      description: 'Seja notificado para não perder seus treinos',
      icon: Calendar,
      key: 'workout_reminders' as keyof NotificationPreferences,
      color: 'text-green-600',
    },
    {
      title: 'Lembretes de Refeição',
      description: 'Receba lembretes para seguir sua dieta',
      icon: Calendar,
      key: 'meal_reminders' as keyof NotificationPreferences,
      color: 'text-orange-600',
    },
    {
      title: 'Conquistas e Badges',
      description: 'Seja notificado quando conquistar novos badges',
      icon: Trophy,
      key: 'achievement_notifications' as keyof NotificationPreferences,
      color: 'text-yellow-600',
    },
    {
      title: 'Atividade da Comunidade',
      description: 'Notificações sobre posts e interações na comunidade',
      icon: Users,
      key: 'community_notifications' as keyof NotificationPreferences,
      color: 'text-pink-600',
    },
    {
      title: 'Mensagens do Coach',
      description: 'Receba notificações de mensagens do seu coach',
      icon: MessageCircle,
      key: 'coach_messages' as keyof NotificationPreferences,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-4">
      {notificationSettings.map((setting) => {
        const Icon = setting.icon;
        const isEnabled = preferences[setting.key];

        return (
          <div
            key={setting.key}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`${setting.color} flex-shrink-0 mt-1`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {setting.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {setting.description}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(setting.key)}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        );
      })}

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mt-6">
        <div className="flex items-start gap-3">
          <Bell size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Dica de Notificações
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Para receber notificações push, você precisa permitir as notificações no seu navegador quando solicitado.
              Você pode gerenciar as permissões nas configurações do navegador a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
