import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/auth-cookie';
import { callApi } from '@/lib/server-api';

interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await callApi(
    '/auth/login',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
    undefined,
  );
  const data = (await res.json()) as AuthResult | unknown;
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const auth = data as AuthResult;
  (await cookies()).set(AUTH_COOKIE, auth.accessToken, authCookieOptions);
  return NextResponse.json({ user: auth.user });
}
