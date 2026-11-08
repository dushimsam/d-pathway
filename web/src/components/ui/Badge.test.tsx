import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, type BadgeVariant } from './Badge';

const cases: Array<[BadgeVariant, string]> = [
  ['neutral', 'bg-n100'],
  ['success', 'bg-success-50'],
  ['warning', 'bg-warning-50'],
  ['danger', 'bg-danger-50'],
  ['info', 'bg-primary-50'],
];

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('defaults to the neutral variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-n100', 'text-n700');
  });

  it.each(cases)('applies classes for the %s variant', (variant, expected) => {
    render(<Badge variant={variant}>Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveClass(expected);
  });

  it('always applies the base classes', () => {
    render(<Badge>Base</Badge>);
    expect(screen.getByText('Base')).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'font-medium',
    );
  });

  it('merges a custom className', () => {
    render(<Badge className="custom-class">Merged</Badge>);
    expect(screen.getByText('Merged')).toHaveClass('custom-class');
  });

  it('renders as a span', () => {
    render(<Badge>Span</Badge>);
    expect(screen.getByText('Span').tagName).toBe('SPAN');
  });
});
