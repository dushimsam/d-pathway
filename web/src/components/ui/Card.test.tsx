import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <span>Inside</span>
      </Card>,
    );
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Card data-testid="card">x</Card>);
    expect(screen.getByTestId('card')).toHaveClass('rounded-[16px]', 'border', 'bg-n0');
  });

  it('merges a custom className', () => {
    render(
      <Card className="custom" data-testid="card">
        x
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('custom');
  });

  it('forwards arbitrary props', () => {
    render(<Card data-testid="card" role="region" />);
    expect(screen.getByTestId('card')).toHaveAttribute('role', 'region');
  });
});
