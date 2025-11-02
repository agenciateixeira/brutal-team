'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function TestPushPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
  } = usePushNotifications();

  const sendTestPush = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Pegar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTestResult({ error: 'Usuário não autenticado' });
        return;
      }

      console.log('🔔 Enviando notificação de teste para user:', user.id);

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: '🎉 Notificação de TESTE!',
          body: 'Se você vê esta notificação, o sistema está funcionando perfeitamente!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          url: '/test-push',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log('📤 Resposta da Edge Function:', { data, error });

      if (error) {
        setTestResult({ error: error.message || 'Erro desconhecido' });
      } else {
        setTestResult({ success: true, data });
      }
    } catch (err: any) {
      console.error('❌ Erro ao enviar teste:', err);
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptions = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTestResult({ error: 'Usuário não autenticado' });
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      console.log('📋 Subscriptions no banco:', data);

      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult({ subscriptions: data });
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar subscriptions:', err);
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔔 Test Push Notifications</h1>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Suporte:</span>
              <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                {isSupported ? '✅ Suportado' : '❌ Não suportado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Permissão:</span>
              <span className={`font-semibold ${
                permission === 'granted' ? 'text-green-600' :
                permission === 'denied' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {permission || 'Não solicitada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inscrito:</span>
              <span className={isSubscribed ? 'text-green-600' : 'text-gray-400'}>
                {isSubscribed ? '✅ Sim' : '❌ Não'}
              </span>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ações</h2>
          <div className="space-y-3">
            {!isSubscribed && (
              <button
                onClick={permission === 'granted' ? subscribe : requestPermission}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isLoading ? 'Processando...' :
                 permission === 'granted' ? 'Inscrever para Notificações' :
                 'Solicitar Permissão'}
              </button>
            )}

            {isSubscribed && (
              <>
                <button
                  onClick={sendTestPush}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : '📤 Enviar Notificação de Teste'}
                </button>

                <button
                  onClick={checkSubscriptions}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : '📋 Ver Subscriptions no Banco'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Resultado</h2>
            <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">📖 Como testar:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Clique em &quot;Solicitar Permissão&quot; e aceite as notificações</li>
            <li>Clique em &quot;Inscrever para Notificações&quot; para salvar a subscription</li>
            <li>Clique em &quot;Ver Subscriptions no Banco&quot; para confirmar que foi salvo</li>
            <li>Clique em &quot;Enviar Notificação de Teste&quot; para enviar uma push</li>
            <li>Verifique se a notificação apareceu na tela bloqueada/topo</li>
            <li>Abra o Console do navegador (F12) para ver logs detalhados</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
