import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1';

type Role = 'GRADUATE' | 'COMPANY';

/** Which role a protected path requires. null = any authenticated user. */
function requiredRole(pathname: string): Role | null {
  if (pathname.startsWith('/deliverables')) return 'COMPANY';
  if (pathname === '/projects' || pathname === '/projects/new') return 'COMPANY';
  if (/^\/projects\/[^/]+\/applications$/.test(pathname)) return 'COMPANY';
  if (/^\/projects\/[^/]+$/.test(pathname)) return 'GRADUATE';
  if (pathname === '/catalogue' || pathname === '/dashboard') return 'GRADUATE';
  if (/^\/applications\/[^/]+\/submit$/.test(pathname)) return 'GRADUATE';
  return null;
}

const homeFor = (role: Role) => (role === 'COMPANY' ? '/projects' : '/dashboard');

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const role = requiredRole(pathname);
  // Public routes (including the landing page at '/') pass through.
  if (role === null) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Resolve role server-side; the API is the authority.
  let userRole: Role | null = null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const me = (await res.json()) as { role: Role };
      userRole = me.role;
    }
  } catch {
    userRole = null;
  }

  if (!userRole) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (role && userRole !== role) {
    const url = req.nextUrl.clone();
    url.pathname = homeFor(userRole);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets and the API routes (the proxy guards itself).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
