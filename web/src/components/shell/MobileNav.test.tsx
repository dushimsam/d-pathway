import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { MobileNav } from './MobileNav';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public status: number, msg: string) {
      super(msg);
    }
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
];

describe('MobileNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
  });

  it('opens and closes the drawer', () => {
    renderWithClient(
      <MobileNav email="me@school.edu" roleLabel="Student" nav={nav} />,
    );
    // drawer closed initially — nav links not visible
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByText('me@school.edu')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
  });

  it('closes the drawer when the backdrop is clicked', () => {
    const { container } = renderWithClient(
      <MobileNav email="me@school.edu" roleLabel="Student" nav={nav} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const backdrop = container.querySelector('.bg-black\\/40') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
  });
});
