import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState, ErrorState, Skeleton } from './States';

describe('Skeleton', () => {
  it('renders with base classes', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse', 'rounded-[8px]', 'bg-n100');
  });

  it('merges a custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstChild).toHaveClass('h-4', 'w-20');
  });
});

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="No items" description="Try adding one" />);
    expect(screen.getByText('Try adding one')).toBeInTheDocument();
  });

  it('does not render a description when absent', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByText('Try adding one')).not.toBeInTheDocument();
  });

  it('renders an action node', () => {
    render(<EmptyState title="No items" action={<button>Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders the default message', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders a custom message', () => {
    render(<ErrorState message="Boom" />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('does not render a retry button without onRetry', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
