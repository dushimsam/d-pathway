import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { WalletNavLink } from './WalletNavLink';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

describe('WalletNavLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a plain Wallet label and /wallet href before data loads', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderWithClient(<WalletNavLink />);
    const link = screen.getByRole('link', { name: /Wallet/ });
    expect(link).toHaveAttribute('href', '/wallet');
  });

  it('links to earnings and formats the balance for graduates', async () => {
    vi.mocked(api.get).mockResolvedValue({
      role: 'GRADUATE',
      currency: 'rwf',
      balance: 125000,
      transactions: [],
    });
    renderWithClient(<WalletNavLink />);
    expect(await screen.findByText('RWF 125,000')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/earnings');
  });

  it('links to the wallet for companies', async () => {
    vi.mocked(api.get).mockResolvedValue({
      role: 'COMPANY',
      currency: 'rwf',
      balance: 500000,
      reserved: 0,
      transactions: [],
    });
    renderWithClient(<WalletNavLink />);
    expect(await screen.findByText('RWF 500,000')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/wallet');
  });
});
