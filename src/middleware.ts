import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Se o acesso vier de questionario.brutalteam.blog.br
  if (hostname === 'questionario.brutalteam.blog.br') {
    // Se estiver acessando a raiz, reescrever para /questionario
    if (request.nextUrl.pathname === '/') {
      return NextResponse.rewrite(new URL('/questionario', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
