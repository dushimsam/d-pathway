import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

function options() {
  return (
    <>
      <option value="a">A</option>
      <option value="b">B</option>
    </>
  );
}

describe('Select', () => {
  it('renders children options with base classes', () => {
    render(<Select>{options()}</Select>);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('h-10', 'w-full', 'rounded-[8px]');
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
  });

  it('merges a custom className', () => {
    render(<Select className="extra">{options()}</Select>);
    expect(screen.getByRole('combobox')).toHaveClass('extra');
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref}>{options()}</Select>);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('applies the disabled attribute', () => {
    render(<Select disabled>{options()}</Select>);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('fires onChange', () => {
    const onChange = vi.fn();
    render(
      <Select onChange={onChange} defaultValue="a">
        {options()}
      </Select>,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
