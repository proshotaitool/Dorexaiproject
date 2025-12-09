import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session');
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host');

  // Define the admin host
  // In development, we might use localhost:3000, but for production strictness:
  const ADMIN_HOST = 'admin.dorexai.space';
  const isDev = process.env.NODE_ENV === 'development';

  // Check if current host is the admin subdomain
  // For dev, you might want to simulate this or allow localhost if testing locally
  // But per user request "only access by admin subdomain", we enforce it strictly for production.
  // We'll trust the user wants this behavior.

  const isAdminSubdomain = host?.includes(ADMIN_HOST);

  // 1. HEADER: Protect Admin Routes from Non-Admin Domains
  // If NOT admin subdomain, BLOCK /admin and /verify-admin
  if (!isAdminSubdomain && !isDev) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/verify-admin')) {
      return NextResponse.redirect(new URL('/', request.url)); // Redirect to main home
    }
  }

  // 2. HEADER: Handle Admin Subdomain behavior
  if (isAdminSubdomain) {
    // If visiting root on admin subdomain, go to verification
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/verify-admin', request.url));
    }
    // If trying to access public tools from admin subdomain, maybe redirect back to main domain?
    // User didn't explicitly ask to block tools on admin subdomain, but typically admin subdomains are for admin only.
    // For now, we focus on the "access admin panel" part.
  }

  // Original Admin Session Logic
  if (pathname.startsWith('/admin/')) {
    if (!sessionCookie && pathname !== '/verify-admin') {
      return NextResponse.redirect(new URL('/verify-admin', request.url));
    }
  }

  if (pathname === '/admin' || pathname === '/verify-admin') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // Redirect disabled tools
  const disabledTools = ['/tools/ai-photo-editor', '/tools/blur-faces', '/tools/image-upscaler'];
  if (disabledTools.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/tools', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
