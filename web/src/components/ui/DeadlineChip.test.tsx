import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeadlineChip } from './DeadlineChip';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function isoHoursFromNow(hours: number): string {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000).toISOString();
}

describe('DeadlineChip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "passed" with a danger tint when the deadline is in the past', () => {
    render(<DeadlineChip iso={isoHoursFromNow(-5)} />);
    const chip = screen.getByText(/passed/);
    expect(chip).toHaveTextContent('passed');
    expect(chip).toHaveClass('bg-danger-50');
  });

  it('shows hours left with a warning tint when under 24h', () => {
    render(<DeadlineChip iso={isoHoursFromNow(5)} />);
    const chip = screen.getByText(/h left/);
    expect(chip).toHaveTextContent('5h left');
    expect(chip).toHaveClass('bg-warning-50');
  });

  it('shows a warning tint between 24h and 48h', () => {
    render(<DeadlineChip iso={isoHoursFromNow(30)} />);
    const chip = screen.getByText(/days left/);
    expect(chip).toHaveTextContent('1 days left');
    expect(chip).toHaveClass('bg-warning-50');
  });

  it('shows days left with a neutral tint when 48h or more away', () => {
    render(<DeadlineChip iso={isoHoursFromNow(72)} />);
    const chip = screen.getByText(/days left/);
    expect(chip).toHaveTextContent('3 days left');
    expect(chip).toHaveClass('bg-n100');
  });

  it('prefixes the optional label', () => {
    render(<DeadlineChip iso={isoHoursFromNow(72)} label="Due" />);
    expect(screen.getByText(/days left/)).toHaveTextContent('Due:');
  });

  it('omits the prefix when no label is given', () => {
    render(<DeadlineChip iso={isoHoursFromNow(72)} />);
    expect(screen.getByText(/days left/).textContent).not.toContain(':');
  });
});
