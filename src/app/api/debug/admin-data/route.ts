import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Verificar todos os profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .order('created_at', { ascending: false });

    // 2. Verificar coaches especificamente
    const { data: coaches, error: coachesError } = await supabase
      .from('profiles')
      .select('*, subscriptions!subscriptions_coach_id_fkey(*)')
      .eq('role', 'coach');

    // 3. Verificar todos os payments
    const { data: allPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Verificar payments com status succeeded
    const { data: succeededPayments, error: succeededError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'succeeded');

    // 5. Verificar subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        allProfiles: {
          count: allProfiles?.length || 0,
          data: allProfiles,
          error: profilesError
        },
        coaches: {
          count: coaches?.length || 0,
          data: coaches,
          error: coachesError
        },
        allPayments: {
          count: allPayments?.length || 0,
          data: allPayments,
          error: paymentsError
        },
        succeededPayments: {
          count: succeededPayments?.length || 0,
          totalPlatformFee: succeededPayments?.reduce((sum, p) => sum + (p.platform_fee || 0), 0) || 0,
          data: succeededPayments,
          error: succeededError
        },
        subscriptions: {
          count: subscriptions?.length || 0,
          data: subscriptions,
          error: subsError
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
