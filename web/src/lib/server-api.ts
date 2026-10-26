import 'server-only';
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from './auth-cookie';
import type { CurrentUser } from './types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1';

/** Server-side call to the real API with an explicit token (used by the proxy). */
export async function callApi(
  path: string,
  init: RequestInit,
  token: string | undefined,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
}

export function apiBaseUrl(): string {
  return API_BASE_URL;
}

/** Read the current user server-side from the httpOnly cookie. Null if unauthenticated. */
export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const res = await callApi('/auth/me', { method: 'GET' }, token);
  if (!res.ok) return null;
  return (await res.json()) as CurrentUser;
}
