import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and defaults type to button', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('respects an explicit type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('defaults to the primary variant and md size', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-primary', 'text-white');
    expect(btn).toHaveClass('h-10', 'px-4');
  });

  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'border'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-danger'],
  ] as const)('applies classes for the %s variant', (variant, expected) => {
    render(<Button variant={variant}>Variant</Button>);
    expect(screen.getByRole('button')).toHaveClass(expected);
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
  ] as const)('applies classes for the %s size', (size, expected) => {
    render(<Button size={size}>Size</Button>);
    expect(screen.getByRole('button')).toHaveClass(expected);
  });

  it('fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Press
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('merges a custom className', () => {
    render(<Button className="extra">Merged</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra');
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('forwards arbitrary props', () => {
    render(<Button aria-label="labelled">X</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'labelled');
  });
});
