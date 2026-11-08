import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithClient } from '@/test/utils';
import { Shell } from './Shell';
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

describe('Shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    localStorage.clear();
  });

  it('renders the sidebar nav, role label, email and children', () => {
    renderWithClient(
      <Shell email="me@school.edu" roleLabel="Student" nav={nav}>
        <p>Page body</p>
      </Shell>,
    );
    // nav labels (appear in sidebar + mobile nav); use getAllByRole
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
    expect(screen.getByText('me@school.edu')).toBeInTheDocument();
    expect(screen.getByText('Page body')).toBeInTheDocument();
  });

  it('collapses and expands the sidebar, persisting to localStorage', () => {
    renderWithClient(
      <Shell email="me@school.edu" roleLabel="Student" nav={nav}>
        <p>Body</p>
      </Shell>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(localStorage.getItem('sidebar-collapsed')).toBe('1');

    const expand = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expand).toBeInTheDocument();
    fireEvent.click(expand);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('0');
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('starts collapsed when localStorage says so', () => {
    localStorage.setItem('sidebar-collapsed', '1');
    renderWithClient(
      <Shell email="me@school.edu" roleLabel="Student" nav={nav}>
        <p>Body</p>
      </Shell>,
    );
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });
});
