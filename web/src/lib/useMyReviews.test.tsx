import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { makeClient } from '@/test/utils';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
}));

import { api } from '@/lib/api-client';
import { useMyReviews } from './useMyReviews';

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('useMyReviews', () => {
  it('indexes written ratings by project id', async () => {
    vi.mocked(api.get).mockResolvedValue([
      { projectId: 'p1', rating: 5 },
      { projectId: 'p2', rating: 3 },
    ]);
    const { result } = renderHook(() => useMyReviews(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.byProjectId.get('p1')).toBe(5);
    expect(result.current.byProjectId.get('p2')).toBe(3);
    expect(result.current.byProjectId.has('p3')).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/reviews/mine');
  });

  it('is an empty map before data loads', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMyReviews(), { wrapper });
    expect(result.current.byProjectId.size).toBe(0);
  });
});
