import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { RateCompany } from './RateCompany';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

describe('RateCompany', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a read-only summary when already rated', () => {
    renderWithClient(
      <RateCompany projectId="p1" companyName="Acme" existingRating={4} />,
    );
    expect(screen.getByText('You rated Acme')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('opens the rating form from the collapsed button', () => {
    renderWithClient(<RateCompany projectId="p1" companyName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Rate Acme' }));
    expect(
      screen.getByRole('button', { name: '3 stars' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 star' })).toBeInTheDocument();
  });

  it('keeps submit disabled until a star is picked, then submits', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    renderWithClient(<RateCompany projectId="p1" companyName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Rate Acme' }));

    const submit = screen.getByRole('button', { name: 'Submit review' });
    expect(submit).toBeDisabled();

    // hover to exercise the hover highlight path, then click a star
    fireEvent.mouseEnter(screen.getByRole('button', { name: '4 stars' }));
    fireEvent.mouseLeave(screen.getByRole('button', { name: '4 stars' }));
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Loved it' },
    });

    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/reviews', {
        projectId: 'p1',
        rating: 4,
        comment: 'Loved it',
      }),
    );
  });

  it('shows an error message when submission fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'));
    renderWithClient(<RateCompany projectId="p1" companyName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Rate Acme' }));
    fireEvent.click(screen.getByRole('button', { name: '2 stars' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(
      await screen.findByText('Could not submit your review. Try again.'),
    ).toBeInTheDocument();
  });

  it('cancels back to the collapsed button', () => {
    renderWithClient(<RateCompany projectId="p1" companyName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Rate Acme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Rate Acme' })).toBeInTheDocument();
  });
});
