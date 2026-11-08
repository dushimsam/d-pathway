import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Faqs } from './Faqs';

describe('Faqs', () => {
  it('renders the section heading and questions', () => {
    render(<Faqs />);
    expect(screen.getByText('FAQs')).toBeInTheDocument();
    expect(screen.getByText('What is D·Pathway?')).toBeInTheDocument();
    expect(screen.getByText('Can students work in teams?')).toBeInTheDocument();
    expect(screen.getByText('Who owns the work and the IP?')).toBeInTheDocument();
  });

  it('renders the contact-us link', () => {
    render(<Faqs />);
    expect(screen.getByRole('link', { name: 'contact us' })).toHaveAttribute(
      'href',
      'mailto:hello@d-pathway.rw',
    );
  });
});
