import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhyChooseUs } from './WhyChooseUs';

describe('WhyChooseUs', () => {
  it('renders the four value cards', () => {
    render(<WhyChooseUs />);
    expect(screen.getByText('Why choose us')).toBeInTheDocument();
    expect(screen.getByText("Trusted by Rwanda's organisations")).toBeInTheDocument();
    expect(screen.getByText('Fast & simple hiring')).toBeInTheDocument();
    expect(screen.getByText('Scales with your growth')).toBeInTheDocument();
    expect(screen.getByText('Quality over quantity')).toBeInTheDocument();
  });

  it('links the accent card to company registration', () => {
    render(<WhyChooseUs />);
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      '/register/company',
    );
  });
});
