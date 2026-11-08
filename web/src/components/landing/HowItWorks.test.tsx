import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from './HowItWorks';

describe('HowItWorks', () => {
  it('renders the three steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('An organisation posts a brief')).toBeInTheDocument();
    expect(screen.getByText('Students deliver the work')).toBeInTheDocument();
    expect(screen.getByText('You invite the best')).toBeInTheDocument();
    // step numbers
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });
});
