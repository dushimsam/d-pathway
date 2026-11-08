import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { BookmarkButton } from './BookmarkButton';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

describe('BookmarkButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts to save when not yet saved', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithClient(<BookmarkButton projectId="p1" saved={false} />);
    const btn = screen.getByRole('button', { name: 'Save brief' });
    expect(btn).toHaveAttribute('title', 'Save for later');
    fireEvent.click(btn);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/catalogue/saved', { projectId: 'p1' }),
    );
  });

  it('deletes to remove when already saved', async () => {
    vi.mocked(api.del).mockResolvedValue({});
    renderWithClient(<BookmarkButton projectId="p9" saved className="extra" />);
    const btn = screen.getByRole('button', { name: 'Remove bookmark' });
    expect(btn).toHaveAttribute('title', 'Saved');
    fireEvent.click(btn);
    await waitFor(() => expect(api.del).toHaveBeenCalledWith('/catalogue/saved/p9'));
  });
});
