import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { ApplicationList } from './ApplicationList';
import { api } from '@/lib/api-client';
import type { MyApplication } from '@/lib/types';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

function app(partial: Partial<MyApplication> & { id: string }): MyApplication {
  return {
    status: 'PENDING',
    note: null,
    declineReason: null,
    termsAcceptedAt: '2026-01-01T00:00:00Z',
    decidedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    project: {
      id: 'p1',
      title: 'Build a landing page',
      status: 'OPEN',
      submissionDeadline: '2026-02-01T00:00:00Z',
      deliverableFormat: 'LINK' as MyApplication['project']['deliverableFormat'],
      coverImageUrl: null,
      company: { id: 'c1', name: 'Acme Co' },
    },
    deliverable: null,
    evaluation: null,
    ...partial,
  } as MyApplication;
}

describe('ApplicationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue([]);
  });

  it('renders a basic application card with title and company', () => {
    renderWithClient(<ApplicationList applications={[app({ id: 'a1' })]} />);
    expect(screen.getByText('Build a landing page')).toBeInTheDocument();
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
  });

  it('renders a cover image when present', () => {
    renderWithClient(
      <ApplicationList
        applications={[
          app({
            id: 'a1',
            project: { ...app({ id: 'x' }).project, coverImageUrl: 'http://img/x.png' },
          }),
        ]}
      />,
    );
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('http://img/x.png');
  });

  it('shows the decline reason when declined', () => {
    renderWithClient(
      <ApplicationList
        applications={[app({ id: 'a1', status: 'DECLINED', declineReason: 'Not a fit' })]}
      />,
    );
    expect(screen.getByText(/Not a fit/)).toBeInTheDocument();
  });

  it('prompts a lead to submit a deliverable when accepted with none', () => {
    renderWithClient(
      <ApplicationList applications={[app({ id: 'a1', status: 'ACCEPTED', role: 'LEAD' })]} />,
    );
    expect(
      screen.getByText(/submit your deliverable before the deadline/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit deliverable' })).toBeInTheDocument();
  });

  it('lets a lead update an already-submitted deliverable', () => {
    renderWithClient(
      <ApplicationList
        applications={[
          app({
            id: 'a1',
            status: 'ACCEPTED',
            role: 'LEAD',
            deliverable: { id: 'd1', submittedAt: '2026-01-02T00:00:00Z' },
          }),
        ]}
      />,
    );
    expect(screen.getByText(/Deliverable submitted/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update deliverable' })).toBeInTheDocument();
  });

  it('shows the team-member view when accepted as a member', () => {
    renderWithClient(
      <ApplicationList applications={[app({ id: 'a1', status: 'ACCEPTED', role: 'MEMBER' })]} />,
    );
    expect(screen.getByText('Teammate')).toBeInTheDocument();
    expect(screen.getByText(/your lead submits the deliverable/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View team' })).toBeInTheDocument();
  });

  it('renders the evaluation block with a stale re-review badge', () => {
    renderWithClient(
      <ApplicationList
        applications={[
          app({
            id: 'a1',
            status: 'ACCEPTED',
            evaluation: {
              score: 4,
              outcome: 'SELECTED_FOR_INTERVIEW' as never,
              feedback: 'Great work',
              evaluatedAt: '2026-01-03T00:00:00Z',
              stale: true,
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Great work')).toBeInTheDocument();
    expect(screen.getByText('Re-review pending')).toBeInTheDocument();
  });

  it('offers to rate the company when accepted', () => {
    renderWithClient(
      <ApplicationList applications={[app({ id: 'a1', status: 'ACCEPTED', role: 'LEAD' })]} />,
    );
    expect(screen.getByRole('button', { name: /Rate Acme Co/ })).toBeInTheDocument();
  });
});
