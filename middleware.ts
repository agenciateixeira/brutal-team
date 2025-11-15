import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const hostname = req.headers.get('host') || '';

  // Se o acesso vier de questionario.brutalteam.blog.br
  if (hostname === 'questionario.brutalteam.blog.br') {
    // Se estiver acessando a raiz, reescrever para /questionario
    if (req.nextUrl.pathname === '/') {
      return NextResponse.rewrite(new URL('/questionario', req.url));
    }
  }

  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/cadastro', '/cadastro-profissional', '/cadastro-coach', '/aguardando-aprovacao', '/questionario'];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/'));

  // Rotas de pagamento que coaches podem acessar sem assinatura ativa
  const paymentRoutes = ['/coach/escolher-plano', '/coach/pagamento-sucesso'];
  const isPaymentRoute = paymentRoutes.some(route => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/'));

  // Rotas de onboarding Stripe que coaches podem acessar sem KYC completo
  const kycRoutes = ['/coach/dados-bancarios', '/coach/perfil'];
  const isKycRoute = kycRoutes.some(route => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/'));

  // Se não está logado e tenta acessar rota privada
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se está logado e tenta acessar rota pública
  if (session && isPublicRoute) {
    // Verificar o role do usuário para redirecionar corretamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, stripe_subscription_status, stripe_charges_enabled, stripe_payouts_enabled, email')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'coach') {
      // ✅ Coach admin com acesso vitalício (nunca precisa pagar)
      const isAdminCoach = profile?.email === 'coach@brutalteam.blog.br';

      // Verificar se o coach tem assinatura ativa antes de redirecionar
      const hasActiveSubscription =
        isAdminCoach || // Admin sempre tem acesso
        profile?.stripe_subscription_status === 'active' ||
        profile?.stripe_subscription_status === 'trialing';

      if (!hasActiveSubscription) {
        console.log('[Middleware] Coach tentando acessar após login sem assinatura, redirecionando para planos');
        return NextResponse.redirect(new URL('/coach/escolher-plano', req.url));
      }

      // ✅ Verificar se completou KYC antes de redirecionar para dashboard
      const hasCompletedKyc = profile?.stripe_charges_enabled && profile?.stripe_payouts_enabled;

      if (!isAdminCoach && !hasCompletedKyc) {
        console.log('[Middleware] Coach após login sem KYC completo, redirecionando para dados bancários');
        return NextResponse.redirect(new URL('/coach/dados-bancarios', req.url));
      }

      return NextResponse.redirect(new URL('/coach/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/aluno/dashboard', req.url));
    }
  }

  // Verificar se está tentando acessar área errada
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approved, stripe_subscription_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_account_id, email')
      .eq('id', session.user.id)
      .single();

    console.log('[Middleware] Verificando acesso:', {
      path: req.nextUrl.pathname,
      role: profile?.role,
      subscriptionStatus: profile?.stripe_subscription_status,
      stripeChargesEnabled: profile?.stripe_charges_enabled,
      stripePayoutsEnabled: profile?.stripe_payouts_enabled,
      hasStripeAccountId: !!profile?.stripe_account_id,
      email: profile?.email
    });

    // Verificar se aluno está aprovado
    if (profile?.role === 'aluno' && profile?.approved === false) {
      if (req.nextUrl.pathname !== '/aguardando-aprovacao') {
        return NextResponse.redirect(new URL('/aguardando-aprovacao', req.url));
      }
    }

    // Coach sem assinatura ativa - redirecionar para escolher plano (exceto se já estiver nas rotas de pagamento)
    if (profile?.role === 'coach' && !isPaymentRoute && req.nextUrl.pathname.startsWith('/coach')) {
      // ✅ Coach admin com acesso vitalício (nunca precisa pagar)
      const isAdminCoach = profile?.email === 'coach@brutalteam.blog.br';

      const hasActiveSubscription =
        isAdminCoach || // Admin sempre tem acesso
        profile?.stripe_subscription_status === 'active' ||
        profile?.stripe_subscription_status === 'trialing';

      // Se NÃO tem assinatura ativa, redirecionar para escolher plano
      if (!hasActiveSubscription) {
        console.log('[Middleware] Coach sem assinatura ativa, redirecionando...', {
          subscriptionStatus: profile?.stripe_subscription_status,
          path: req.nextUrl.pathname
        });
        return NextResponse.redirect(new URL('/coach/escolher-plano', req.url));
      }
    }

    // ✅ VERIFICAÇÃO DE KYC OBRIGATÓRIO - Coach precisa completar dados bancários
    if (profile?.role === 'coach' && !isKycRoute && !isPaymentRoute && req.nextUrl.pathname.startsWith('/coach')) {
      const isAdminCoach = profile?.email === 'coach@brutalteam.blog.br';

      // Verificar se KYC está completo (charges_enabled E payouts_enabled)
      const hasCompletedKyc = profile?.stripe_charges_enabled && profile?.stripe_payouts_enabled;

      // Admin coach não precisa de KYC, mas outros coaches SIM
      if (!isAdminCoach && !hasCompletedKyc) {
        console.log('[Middleware] Coach sem KYC completo, redirecionando para dados bancários...', {
          stripeChargesEnabled: profile?.stripe_charges_enabled,
          stripePayoutsEnabled: profile?.stripe_payouts_enabled,
          hasStripeAccountId: !!profile?.stripe_account_id,
          path: req.nextUrl.pathname
        });
        return NextResponse.redirect(new URL('/coach/dados-bancarios', req.url));
      }
    }

    // Coach tentando acessar área do aluno
    if (profile?.role === 'coach' && req.nextUrl.pathname.startsWith('/aluno')) {
      return NextResponse.redirect(new URL('/coach/dashboard', req.url));
    }

    // Aluno tentando acessar área do coach
    if (profile?.role === 'aluno' && req.nextUrl.pathname.startsWith('/coach')) {
      return NextResponse.redirect(new URL('/aluno/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
