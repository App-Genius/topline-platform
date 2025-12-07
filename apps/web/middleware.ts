import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/admin',
  '/manager',
  '/staff',
];

// Routes that are public (no auth required)
const publicRoutes = [
  '/login',
  '/questionnaire',
  '/scoreboard', // Scoreboard is public for TV display
  '/',
  '/setup',
  '/strategy',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('topline_access_token')?.value;

  // Check if accessing protected route without token
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  // For now, allow all routes in demo mode
  // In production, uncomment below to enforce auth
  /*
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  */

  // If logged in user tries to access login page, redirect to admin
  /*
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
