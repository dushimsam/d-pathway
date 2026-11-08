import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { ActivityFeed } from './ActivityFeed';
import { api } from '@/lib/api-client';
import type { ActivityItem } from '@/lib/types';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

function item(partial: Partial<ActivityItem> & { id: string }): ActivityItem {
  return {
    type: 'DELIVERABLE_SUBMITTED',
    message: 'Something happened',
    projectId: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe('ActivityFeed', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing while loading', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithClient(<ActivityFeed />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no activity', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { container } = renderWithClient(<ActivityFeed />);
    // give the query a tick to settle
    await Promise.resolve();
    expect(container.querySelector('h2')).toBeNull();
  });

  it('renders activity items with varied types', async () => {
    vi.mocked(api.get).mockResolvedValue([
      item({ id: '1', type: 'EVALUATION_RECORDED', message: 'You were scored' }),
      item({ id: '2', type: 'APPLICATION_ACCEPTED', message: 'Accepted' }),
      item({ id: '3', type: 'APPLICATION_DECLINED', message: 'Declined' }),
      item({ id: '4', type: 'PRIZE_AWARDED', message: 'You won a prize' }),
      // unknown type exercises the `?? ActivityIcon` fallback
      item({ id: '5', type: 'MYSTERY' as ActivityItem['type'], message: 'Unknown event' }),
    ]);
    renderWithClient(<ActivityFeed />);
    expect(await screen.findByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByText('You were scored')).toBeInTheDocument();
    expect(screen.getByText('Unknown event')).toBeInTheDocument();
  });

  it('shows at most eight items', async () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      item({ id: String(i), message: `Event ${i}` }),
    );
    vi.mocked(api.get).mockResolvedValue(many);
    renderWithClient(<ActivityFeed />);
    await screen.findByText('Recent activity');
    expect(screen.getByText('Event 0')).toBeInTheDocument();
    expect(screen.getByText('Event 7')).toBeInTheDocument();
    expect(screen.queryByText('Event 8')).not.toBeInTheDocument();
  });
});
