import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagInput } from './TagInput';

/** Controlled harness so onChange actually updates the rendered chips. */
function Harness({
  initial = [],
  onChangeSpy,
  disabled,
  placeholder,
  id = 'tags',
}: {
  initial?: string[];
  onChangeSpy?: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <TagInput
      id={id}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(next) => {
        onChangeSpy?.(next);
        setValue(next);
      }}
    />
  );
}

function getInput() {
  return document.getElementById('tags') as HTMLInputElement;
}

describe('TagInput', () => {
  it('renders existing tags', () => {
    render(<Harness initial={['React', 'Vue']} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('adds a tag on Enter and calls onChange', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'TypeScript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('adds a tag when the comma key is pressed', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'Go' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['Go']);
  });

  it('commits comma-separated values at once', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'A, B, C' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['A', 'B', 'C']);
  });

  it('dedupes case-insensitively', () => {
    const onChange = vi.fn();
    render(<Harness initial={['React']} onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Dedupe keeps the original, so onChange still fires but value is unchanged.
    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  it('ignores an empty or whitespace-only commit and just clears the draft', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('commits the draft on blur', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'Rust' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(['Rust']);
  });

  it('removes a tag when its remove button is clicked', () => {
    const onChange = vi.fn();
    render(<Harness initial={['React', 'Vue']} onChangeSpy={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove React' }));
    expect(onChange).toHaveBeenCalledWith(['Vue']);
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('removes the last tag on Backspace with an empty draft', () => {
    const onChange = vi.fn();
    render(<Harness initial={['React', 'Vue']} onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  it('does not remove a tag on Backspace when the draft is non-empty', () => {
    const onChange = vi.fn();
    render(<Harness initial={['React']} onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not remove on Backspace when there are no tags', () => {
    const onChange = vi.fn();
    render(<Harness onChangeSpy={onChange} />);
    fireEvent.keyDown(getInput(), { key: 'Backspace' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the placeholder when empty', () => {
    render(<Harness placeholder="Add skills" />);
    expect(getInput()).toHaveAttribute('placeholder', 'Add skills');
  });

  it('hides the placeholder when there are tags', () => {
    render(<Harness initial={['React']} placeholder="Add skills" />);
    expect(getInput()).toHaveAttribute('placeholder', '');
  });

  it('focuses the input when the container is clicked', () => {
    const { container } = render(<Harness />);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.click(wrapper);
    expect(document.activeElement).toBe(getInput());
  });

  it('handles a container click when no id is provided', () => {
    const { container } = render(
      <TagInput value={[]} onChange={vi.fn()} />,
    );
    // No id means getElementById('') returns null; the click must not throw.
    expect(() => fireEvent.click(container.firstChild as HTMLElement)).not.toThrow();
  });

  it('disables the input and hides remove buttons when disabled', () => {
    render(<Harness initial={['React']} disabled />);
    expect(getInput()).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Remove React' }),
    ).not.toBeInTheDocument();
  });

  it('does not focus the input on container click when disabled', () => {
    const { container } = render(<Harness disabled />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(document.activeElement).not.toBe(getInput());
  });

  it('other keys do not commit or remove', () => {
    const onChange = vi.fn();
    render(<Harness initial={['React']} onChangeSpy={onChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.keyDown(input, { key: 'a' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
