
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session');

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin/')) {
    if (!sessionCookie && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (pathname === '/admin' || pathname === '/admin/login') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // Redirect disabled tools
  const disabledTools = ['/tools/ai-photo-editor', '/tools/blur-faces', '/tools/image-upscaler'];
  if (disabledTools.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/tools', request.url));
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/tools/:path*'],
}
