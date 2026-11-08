import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CtaBanner } from './CtaBanner';

describe('CtaBanner', () => {
  it('renders the headline and call-to-action links', () => {
    render(<CtaBanner />);
    expect(
      screen.getByText('Kick off your hiring now — quick and easy!'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      '/register/company',
    );
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
      'href',
      'mailto:hello@d-pathway.rw',
    );
  });

  it('renders the floating brief and stat cards', () => {
    render(<CtaBanner />);
    expect(screen.getByText('Logo & brand kit')).toBeInTheDocument();
    expect(screen.getByText('Open briefs')).toBeInTheDocument();
  });
});
