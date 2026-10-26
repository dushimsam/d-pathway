import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';

export async function POST(): Promise<Response> {
  (await cookies()).delete(AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
