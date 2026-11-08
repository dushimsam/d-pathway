import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it.each([
    ['DRAFT', 'Draft', 'bg-n100'],
    ['OPEN', 'Open', 'bg-success-50'],
    ['IN_PROGRESS', 'In progress', 'bg-primary-50'],
    ['CLOSED', 'Closed', 'bg-n100'],
    ['PENDING', 'Pending', 'bg-warning-50'],
    ['ACCEPTED', 'Accepted', 'bg-success-50'],
    ['DECLINED', 'Declined', 'bg-danger-50'],
    ['INVITED', 'Invited', 'bg-warning-50'],
    ['SELECTED_FOR_INTERVIEW', 'Selected for interview', 'bg-success-50'],
    ['NOT_SELECTED', 'Not selected', 'bg-danger-50'],
  ])('maps %s to its label and variant', (status, label, cls) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(label)).toHaveClass(cls);
  });

  it('falls back to a neutral badge with the raw status for unknown values', () => {
    render(<StatusPill status="SOMETHING_ELSE" />);
    expect(screen.getByText('SOMETHING_ELSE')).toHaveClass('bg-n100');
  });
});
