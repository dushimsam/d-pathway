import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrizeBadge, formatPrize } from './PrizeBadge';

describe('formatPrize', () => {
  it('uses the given currency', () => {
    expect(formatPrize(150000, 'USD')).toBe('USD 150,000');
  });

  it('falls back to RWF when currency is null', () => {
    expect(formatPrize(150000, null)).toBe('RWF 150,000');
  });

  it('formats zero', () => {
    expect(formatPrize(0, 'RWF')).toBe('RWF 0');
  });
});

describe('PrizeBadge', () => {
  it('renders the formatted prize', () => {
    render(<PrizeBadge amount={150000} currency="RWF" />);
    expect(screen.getByText('RWF 150,000')).toBeInTheDocument();
  });

  it('falls back to RWF when currency is null', () => {
    render(<PrizeBadge amount={1000} currency={null} />);
    expect(screen.getByText('RWF 1,000')).toBeInTheDocument();
  });

  it('applies md size classes by default', () => {
    const { container } = render(<PrizeBadge amount={100} currency="RWF" />);
    expect(container.firstChild).toHaveClass('px-3', 'py-1', 'text-[14px]');
  });

  it('applies sm size classes', () => {
    const { container } = render(
      <PrizeBadge amount={100} currency="RWF" size="sm" />,
    );
    expect(container.firstChild).toHaveClass('px-2.5', 'py-0.5', 'text-[12px]');
  });

  it('merges a custom className', () => {
    const { container } = render(
      <PrizeBadge amount={100} currency="RWF" className="custom" />,
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});
