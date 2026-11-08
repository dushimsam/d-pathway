import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input with base classes', () => {
    render(<Input placeholder="Name" />);
    const input = screen.getByPlaceholderText('Name');
    expect(input).toHaveClass('h-10', 'w-full', 'rounded-[8px]', 'border');
  });

  it('merges a custom className', () => {
    render(<Input className="extra" placeholder="Name" />);
    expect(screen.getByPlaceholderText('Name')).toHaveClass('extra');
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards props and applies the disabled attribute', () => {
    render(<Input disabled placeholder="Name" />);
    expect(screen.getByPlaceholderText('Name')).toBeDisabled();
  });

  it('fires onChange', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} placeholder="Name" />);
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'abc' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
