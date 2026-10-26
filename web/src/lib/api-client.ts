// Thin fetch wrapper used by client components. It talks to the same-origin
// /api/v1 proxy (app/api/v1/[...path]), which injects the bearer token from the
// httpOnly cookie — so no token ever touches the browser or localStorage.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string | string[];
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const b = (body ?? {}) as ApiErrorBody;
    const msgs = Array.isArray(b.message) ? b.message : b.message ? [b.message] : [];
    const message = msgs[0] ?? res.statusText ?? 'Request failed';
    throw new ApiError(res.status, message, msgs);
  }
  return body as T;
}

const BASE = '/api/v1';

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${BASE}${path}`, { credentials: 'same-origin' }).then(parse<T>);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(parse<T>);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(parse<T>);
  },
};
