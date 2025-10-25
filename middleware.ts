import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rotas públicas
  const publicRoutes = ['/login', '/cadastro', '/aguardando-aprovacao'];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route);

  // Se não está logado e tenta acessar rota privada
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Se está logado e tenta acessar rota pública
  if (session && isPublicRoute) {
    // Verificar o role do usuário para redirecionar corretamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'coach') {
      return NextResponse.redirect(new URL('/coach/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/aluno/dashboard', req.url));
    }
  }

  // Verificar se está tentando acessar área errada
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approved')
      .eq('id', session.user.id)
      .single();

    // Verificar se aluno está aprovado
    if (profile?.role === 'aluno' && profile?.approved === false) {
      if (req.nextUrl.pathname !== '/aguardando-aprovacao') {
        return NextResponse.redirect(new URL('/aguardando-aprovacao', req.url));
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
