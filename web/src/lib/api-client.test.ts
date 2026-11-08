import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api-client';

function res(body: unknown, init?: { ok?: boolean; status?: number; statusText?: string }) {
  const text = body === null ? '' : JSON.stringify(body);
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    text: async () => text,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api.get', () => {
  it('hits the /api/v1 proxy with same-origin credentials and parses JSON', async () => {
    fetchMock.mockResolvedValue(res({ hello: 'world' }));
    const out = await api.get<{ hello: string }>('/things');
    expect(out).toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/things', {
      credentials: 'same-origin',
    });
  });

  it('returns null for an empty body', async () => {
    fetchMock.mockResolvedValue(res(null));
    await expect(api.get('/empty')).resolves.toBeNull();
  });
});

describe('api.post / patch / del', () => {
  it('posts a JSON body with the right headers', async () => {
    fetchMock.mockResolvedValue(res({ id: 1 }));
    await api.post('/things', { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/things', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it('omits the body when none is given', async () => {
    fetchMock.mockResolvedValue(res({ ok: true }));
    await api.post('/ping');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ body: undefined });
  });

  it('sends a PATCH with a body', async () => {
    fetchMock.mockResolvedValue(res({ ok: true }));
    await api.patch('/things/1', { a: 2 });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ a: 2 }),
    });
  });

  it('sends a DELETE', async () => {
    fetchMock.mockResolvedValue(res(null));
    await api.del('/things/1');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/things/1', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  });
});

describe('error handling', () => {
  it('throws ApiError with the first message from a message array', async () => {
    fetchMock.mockResolvedValue(
      res({ message: ['too short', 'required'] }, { ok: false, status: 400 }),
    );
    await expect(api.get('/bad')).rejects.toMatchObject({
      status: 400,
      message: 'too short',
      fieldErrors: ['too short', 'required'],
    });
    await expect(api.get('/bad')).rejects.toBeInstanceOf(ApiError);
  });

  it('handles a single string message', async () => {
    fetchMock.mockResolvedValue(
      res({ message: 'Not found' }, { ok: false, status: 404 }),
    );
    await expect(api.get('/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    });
  });

  it('falls back to statusText when there is no message', async () => {
    fetchMock.mockResolvedValue(
      res({}, { ok: false, status: 500, statusText: 'Server Error' }),
    );
    await expect(api.get('/boom')).rejects.toMatchObject({
      status: 500,
      message: 'Server Error',
    });
  });
});

describe('ApiError', () => {
  it('carries status, message and optional field errors', () => {
    const e = new ApiError(422, 'Invalid', ['a']);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
    expect(e.status).toBe(422);
    expect(e.fieldErrors).toEqual(['a']);
  });
});
