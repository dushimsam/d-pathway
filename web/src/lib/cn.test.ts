import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('resolves conflicting Tailwind utilities (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-n500', 'text-n900')).toBe('text-n900');
  });

  it('supports arrays and conditional objects', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });
});
