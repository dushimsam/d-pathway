import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { InvitationsInbox } from './InvitationsInbox';
import { api, ApiError } from '@/lib/api-client';
import type { MyInvitation } from '@/lib/types';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

function invite(id: string): MyInvitation {
  return {
    id,
    invitedAt: '2026-01-01T00:00:00Z',
    application: {
      id: `app-${id}`,
      status: 'PENDING',
      leadName: 'Alice',
      project: { id: 'p1', title: 'Cool Project', company: { name: 'Acme Co' } },
    },
  };
}

describe('InvitationsInbox', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when there are no invitations', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    const { container } = renderWithClient(<InvitationsInbox />);
    await Promise.resolve();
    expect(container.querySelector('h2')).toBeNull();
  });

  it('lists pending invitations', async () => {
    vi.mocked(api.get).mockResolvedValue([invite('1')]);
    renderWithClient(<InvitationsInbox />);
    expect(await screen.findByText('Team invitations (1)')).toBeInTheDocument();
    expect(screen.getByText(/Alice invited you to/)).toBeInTheDocument();
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
  });

  it('accepts an invitation', async () => {
    vi.mocked(api.get).mockResolvedValue([invite('1')]);
    vi.mocked(api.post).mockResolvedValue({});
    renderWithClient(<InvitationsInbox />);
    await screen.findByText('Team invitations (1)');
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/invitations/1/accept'),
    );
  });

  it('declines an invitation', async () => {
    vi.mocked(api.get).mockResolvedValue([invite('1')]);
    vi.mocked(api.post).mockResolvedValue({});
    renderWithClient(<InvitationsInbox />);
    await screen.findByText('Team invitations (1)');
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/invitations/1/decline'),
    );
  });

  it('shows an ApiError message when responding fails', async () => {
    vi.mocked(api.get).mockResolvedValue([invite('1')]);
    vi.mocked(api.post).mockRejectedValue(new ApiError(400, 'Already responded'));
    renderWithClient(<InvitationsInbox />);
    await screen.findByText('Team invitations (1)');
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(await screen.findByText('Already responded')).toBeInTheDocument();
  });

  it('shows a fallback message for non-ApiError failures', async () => {
    vi.mocked(api.get).mockResolvedValue([invite('1')]);
    vi.mocked(api.post).mockRejectedValue(new Error('network'));
    renderWithClient(<InvitationsInbox />);
    await screen.findByText('Team invitations (1)');
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(
      await screen.findByText('Could not update the invitation.'),
    ).toBeInTheDocument();
  });
});
