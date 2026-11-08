import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { makeClient } from '@/test/utils';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
}));

import { api } from '@/lib/api-client';
import { useSavedBriefs } from './useSavedBriefs';

function wrapper({ children }: { children: ReactNode }) {
  const client = makeClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => vi.clearAllMocks());

describe('useSavedBriefs', () => {
  it('exposes the bookmarked ids as a Set', async () => {
    vi.mocked(api.get).mockResolvedValue(['p1', 'p2']);
    const { result } = renderHook(() => useSavedBriefs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.ids.has('p1')).toBe(true);
    expect(result.current.ids.has('p2')).toBe(true);
    expect(result.current.ids.has('other')).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/catalogue/saved/ids');
  });

  it('starts with an empty Set before data arrives', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSavedBriefs(), { wrapper });
    expect(result.current.ids.size).toBe(0);
  });
});
