import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';
import { UserRole } from '@/lib/types';

type Role = UserRole;

/** Which role a protected path requires. null = any authenticated user. */
function requiredRole(pathname: string): Role | null {
  if (pathname.startsWith('/deliverables')) return UserRole.COMPANY;
  if (pathname === '/projects' || pathname === '/projects/new') return UserRole.COMPANY;
  if (/^\/projects\/[^/]+\/applications$/.test(pathname)) return UserRole.COMPANY;
  if (/^\/projects\/[^/]+\/board$/.test(pathname)) return UserRole.COMPANY;
  if (/^\/projects\/[^/]+$/.test(pathname)) return UserRole.GRADUATE;
  if (pathname === '/catalogue' || pathname === '/dashboard') return UserRole.GRADUATE;
  if (pathname === '/applications' || pathname === '/earnings') return UserRole.GRADUATE;
  if (pathname === '/saved' || pathname === '/profile') return UserRole.GRADUATE;
  if (/^\/applications\/[^/]+\/submit$/.test(pathname)) return UserRole.GRADUATE;
  if (pathname === '/wallet' || pathname === '/settings') return UserRole.COMPANY;
  if (pathname === '/talent' || /^\/students\/[^/]+$/.test(pathname)) return UserRole.COMPANY;
  // Public company pages (/companies/:id) pass through for anyone.
  return null;
}

const homeFor = (role: Role) => (role === UserRole.COMPANY ? '/projects' : '/dashboard');

/**
 * Decode a JWT payload without verifying its signature. This is only used to
 * route (which page to show); the API verifies the signature on every data
 * request, so it stays the real security boundary. Reading the role from the
 * token means middleware makes NO network call per navigation — which is faster
 * and, crucially, can't log you out just because an /auth/me call hiccuped.
 */
function decodeToken(token: string): { role?: Role; exp?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    // base64url -> base64, then pad to a multiple of 4 (atob can be strict).
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as { role?: Role; exp?: number };
  } catch {
    return null;
  }
}

function toLogin(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const role = requiredRole(pathname);
  // Public routes (including the landing page at '/') pass through.
  if (role === null) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return toLogin(req, pathname);

  // Resolve the role from the token itself — no per-navigation API call.
  const payload = decodeToken(token);
  const nowSec = Math.floor(Date.now() / 1000);
  const expired = payload?.exp != null && payload.exp < nowSec;
  if (!payload?.role || expired) {
    // Missing or expired session: send to login and remember where to return.
    return toLogin(req, pathname);
  }

  // Wrong role for this route: send the user to their own home.
  if (payload.role !== role) {
    const url = req.nextUrl.clone();
    url.pathname = homeFor(payload.role);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets and the API routes (the proxy guards itself).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
