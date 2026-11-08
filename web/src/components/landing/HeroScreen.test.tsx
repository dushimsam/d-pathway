import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroScreen } from './HeroScreen';

describe('HeroScreen', () => {
  it('renders the student view with register CTA when logged out', () => {
    render(<HeroScreen home={null} />);
    expect(screen.getByText(/Prove you/)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: 'Start free trial' });
    expect(cta).toHaveAttribute('href', '/register/graduate');
    // logged-out nav shows Log in + Start free
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start free' })).toBeInTheDocument();
  });

  it('switches to the organisation view and retargets the CTA', () => {
    render(<HeroScreen home={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'ORGANISATION' }));
    expect(screen.getByText(/Meet the Best/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start free trial' })).toHaveAttribute(
      'href',
      '/register/company',
    );
  });

  it('shows the dashboard CTA when a home route is provided', () => {
    render(<HeroScreen home="/dashboard" />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    const cta = screen.getByRole('link', { name: 'Continue to dashboard' });
    expect(cta).toHaveAttribute('href', '/dashboard');
  });

  it('renders the partner strip', () => {
    render(<HeroScreen home={null} />);
    expect(screen.getByText('ALU')).toBeInTheDocument();
    expect(screen.getByText('CMU-Africa')).toBeInTheDocument();
  });
});
