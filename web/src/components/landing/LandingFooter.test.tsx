import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFooter } from './LandingFooter';

describe('LandingFooter', () => {
  it('renders the column headings and internal links', () => {
    render(<LandingFooter />);
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Organisations')).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();

    // internal link rendered as a next/link anchor
    expect(screen.getByRole('link', { name: 'Student portal' })).toHaveAttribute(
      'href',
      '/register/graduate',
    );
    // hash anchor rendered as a plain <a>
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute(
      'href',
      '#how',
    );
  });

  it('renders the data-sovereignty note and copyright', () => {
    render(<LandingFooter />);
    expect(screen.getByText(/Personal data is stored in Rwanda/)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 D·Pathway/)).toBeInTheDocument();
  });
});
