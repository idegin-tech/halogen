import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = path.startsWith('/client/projects') || path.startsWith('/admin');
  
  const halogonSessionCookie = request.cookies.get('halogen.sid');
  
  if (isProtectedRoute && !halogonSessionCookie) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  const isAuthPage = path === '/' || path === '/register';
  if (isAuthPage && halogonSessionCookie) {
    const redirectUrl = new URL('/client', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};