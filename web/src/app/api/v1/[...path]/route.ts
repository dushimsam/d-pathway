import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth-cookie';
import { callApi } from '@/lib/server-api';

// Same-origin proxy: forwards /api/v1/* to the real API, attaching the bearer
// token from the httpOnly cookie. Client components call this; the token is
// never exposed to the browser.
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const target = `/${path.join('/')}${req.nextUrl.search}`;
  const method = req.method;
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.text();

  const res = await callApi(
    target,
    {
      method,
      headers: { 'Content-Type': req.headers.get('content-type') ?? 'application/json' },
      body,
    },
    token,
  );

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
