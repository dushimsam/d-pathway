import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { makeClient } from '@/test/utils';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
}));

import { api } from '@/lib/api-client';
import { useMyApplications } from './useMyApplications';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('useMyApplications', () => {
  it('indexes applications by their project id', async () => {
    vi.mocked(api.get).mockResolvedValue([
      { id: 'a1', project: { id: 'p1' }, status: 'PENDING' },
      { id: 'a2', project: { id: 'p2' }, status: 'ACCEPTED' },
    ]);
    const { result } = renderHook(() => useMyApplications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.byProjectId.get('p1')?.id).toBe('a1');
    expect(result.current.byProjectId.get('p2')?.status).toBe('ACCEPTED');
    expect(api.get).toHaveBeenCalledWith('/applications/mine');
  });

  it('is an empty map before data loads', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMyApplications(), { wrapper });
    expect(result.current.byProjectId.size).toBe(0);
  });
});
