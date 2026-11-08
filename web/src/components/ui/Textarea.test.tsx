import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders with base classes and a default row count', () => {
    render(<Textarea placeholder="Bio" />);
    const el = screen.getByPlaceholderText('Bio');
    expect(el).toHaveClass('w-full', 'rounded-[8px]', 'border');
    expect(el).toHaveAttribute('rows', '4');
  });

  it('respects an explicit rows value', () => {
    render(<Textarea rows={8} placeholder="Bio" />);
    expect(screen.getByPlaceholderText('Bio')).toHaveAttribute('rows', '8');
  });

  it('merges a custom className', () => {
    render(<Textarea className="extra" placeholder="Bio" />);
    expect(screen.getByPlaceholderText('Bio')).toHaveClass('extra');
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies the disabled attribute', () => {
    render(<Textarea disabled placeholder="Bio" />);
    expect(screen.getByPlaceholderText('Bio')).toBeDisabled();
  });

  it('fires onChange', () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} placeholder="Bio" />);
    fireEvent.change(screen.getByPlaceholderText('Bio'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
