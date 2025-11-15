// Supabase Edge Function para enviar Push Notifications
// Deploy: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Pegar dados do request
    const { userId, title, body, icon, badge, data, url } = await req.json()

    if (!userId) {
      throw new Error('userId é obrigatório')
    }

    // Buscar todas as subscriptions ativas do usuário
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhuma subscription ativa encontrada para este usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Preparar payload da notificação
    const payload = JSON.stringify({
      title: title || 'Brutal Team',
      body: body || 'Você tem uma nova notificação',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-192x192.png',
      data: {
        url: url || '/',
        ...data,
      },
    })

    // Configurar VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''

    webpush.setVapidDetails(
      'mailto:contato@brutalteam.com',
      vapidPublicKey,
      vapidPrivateKey
    )

    // Enviar notificação para todas as subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, payload)

          // Atualizar last_used_at
          await supabaseClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id)

          return {
            subscription_id: sub.id,
            success: true,
          }
        } catch (error) {
          console.error('Erro ao enviar push:', error)

          // Se subscription expirou (410), marcar como inativa
          if (error.statusCode === 410) {
            await supabaseClient
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
          }

          return {
            subscription_id: sub.id,
            success: false,
            error: error.message,
            statusCode: error.statusCode,
          }
        }
      })
    )

    const successCount = results.filter((r) => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} de ${results.length} notificações enviadas com sucesso`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
