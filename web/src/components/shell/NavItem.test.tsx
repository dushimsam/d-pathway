import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavItem } from './NavItem';

const { pathnameRef } = vi.hoisted(() => ({ pathnameRef: { current: '/projects' } }));

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameRef.current,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('NavItem', () => {
  beforeEach(() => {
    pathnameRef.current = '/projects';
  });

  it('marks the exactly-matching route as active', () => {
    render(<NavItem href="/projects" label="Projects" />);
    const link = screen.getByRole('link', { name: 'Projects' });
    expect(link).toHaveClass('bg-primary-50');
    expect(link).toHaveAttribute('href', '/projects');
  });

  it('marks a nested route as active', () => {
    pathnameRef.current = '/projects/123';
    render(<NavItem href="/projects" label="Projects" />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveClass('bg-primary-50');
  });

  it('is inactive for a non-matching route', () => {
    pathnameRef.current = '/dashboard';
    render(<NavItem href="/settings" label="Settings" />);
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).not.toHaveClass('bg-primary-50');
    expect(link).toHaveClass('text-n700');
  });
});
