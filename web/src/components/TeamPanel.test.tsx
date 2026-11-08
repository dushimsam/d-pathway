import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { TeamPanel } from './TeamPanel';
import { api, ApiError } from '@/lib/api-client';
import type { Team, TeamMember } from '@/lib/types';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

function member(partial: Partial<TeamMember> & { id: string }): TeamMember {
  return {
    graduateId: `g-${partial.id}`,
    fullName: 'Member X',
    status: 'PENDING' as TeamMember['status'],
    invitedAt: '2026-01-01T00:00:00Z',
    respondedAt: null,
    ...partial,
  };
}

function team(members: TeamMember[]): Team {
  return { lead: { graduateId: 'lead-1', fullName: 'Lead Larry' }, members };
}

describe('TeamPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing before data loads', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithClient(
      <TeamPanel applicationId="a1" isLead canInvite />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the roster with the lead and active members', async () => {
    vi.mocked(api.get).mockResolvedValue(
      team([
        member({ id: '1', fullName: 'Bob', status: 'ACCEPTED' as TeamMember['status'] }),
        member({ id: '2', fullName: 'Gone', status: 'DECLINED' as TeamMember['status'] }),
      ]),
    );
    renderWithClient(<TeamPanel applicationId="a1" isLead={false} canInvite={false} />);
    expect(await screen.findByText('Lead Larry')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // declined members are filtered out
    expect(screen.queryByText('Gone')).not.toBeInTheDocument();
    // 1 lead + 1 active member
    expect(screen.getByText('Team (2/4)')).toBeInTheDocument();
  });

  it('lets the lead invite a teammate', async () => {
    vi.mocked(api.get).mockResolvedValue(team([]));
    vi.mocked(api.post).mockResolvedValue({});
    renderWithClient(<TeamPanel applicationId="a1" isLead canInvite />);
    await screen.findByText('Lead Larry');

    const input = screen.getByPlaceholderText('teammate@school.edu');
    fireEvent.change(input, { target: { value: 'friend@school.edu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/applications/a1/invitations', {
        email: 'friend@school.edu',
      }),
    );
  });

  it('shows an ApiError message when the invite fails', async () => {
    vi.mocked(api.get).mockResolvedValue(team([]));
    vi.mocked(api.post).mockRejectedValue(new ApiError(409, 'Already invited'));
    renderWithClient(<TeamPanel applicationId="a1" isLead canInvite />);
    await screen.findByText('Lead Larry');
    fireEvent.change(screen.getByPlaceholderText('teammate@school.edu'), {
      target: { value: 'dup@school.edu' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(await screen.findByText('Already invited')).toBeInTheDocument();
  });

  it('tells a lead the team is full when no seats remain', async () => {
    vi.mocked(api.get).mockResolvedValue(
      team([
        member({ id: '1', status: 'ACCEPTED' as TeamMember['status'] }),
        member({ id: '2', status: 'ACCEPTED' as TeamMember['status'] }),
        member({ id: '3', status: 'PENDING' as TeamMember['status'] }),
      ]),
    );
    renderWithClient(<TeamPanel applicationId="a1" isLead canInvite />);
    expect(await screen.findByText('Your team is full.')).toBeInTheDocument();
    expect(screen.getByText('Team (4/4)')).toBeInTheDocument();
  });

  it('explains when invites are closed (cannot invite)', async () => {
    vi.mocked(api.get).mockResolvedValue(team([]));
    renderWithClient(<TeamPanel applicationId="a1" isLead canInvite={false} />);
    expect(
      await screen.findByText(/Teammates can only be invited while/),
    ).toBeInTheDocument();
  });
});
