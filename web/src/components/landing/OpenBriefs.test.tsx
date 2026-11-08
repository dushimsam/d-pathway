import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpenBriefs } from './OpenBriefs';

describe('OpenBriefs', () => {
  it('renders the showcase briefs with prizes and open badges', () => {
    render(<OpenBriefs />);
    expect(screen.getByText('Community events landing page')).toBeInTheDocument();
    expect(screen.getByText('Internal metrics dashboard')).toBeInTheDocument();
    // a brief with a prize
    expect(screen.getByText('RWF 150,000')).toBeInTheDocument();
    // a brief without a prize shows "Open"
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
  });

  it('links to the catalogue', () => {
    render(<OpenBriefs />);
    const browseAll = screen.getByRole('link', { name: /Browse all briefs/ });
    expect(browseAll).toHaveAttribute('href', '/catalogue');
    expect(screen.getAllByRole('link', { name: 'View brief' }).length).toBeGreaterThan(0);
  });
});
