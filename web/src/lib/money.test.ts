import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats with thousands separators and an upper-cased currency', () => {
    expect(formatMoney(1000)).toBe('RWF 1,000');
    expect(formatMoney(1500000)).toBe('RWF 1,500,000');
  });

  it('defaults to RWF and upper-cases a provided currency', () => {
    expect(formatMoney(50, 'usd')).toBe('USD 50');
  });

  it('rounds to a whole unit', () => {
    expect(formatMoney(1000.6)).toBe('RWF 1,001');
    expect(formatMoney(1000.4)).toBe('RWF 1,000');
  });

  it('handles zero', () => {
    expect(formatMoney(0)).toBe('RWF 0');
  });
});
