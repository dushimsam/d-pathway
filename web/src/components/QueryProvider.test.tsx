import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from './QueryProvider';

function Consumer() {
  const { data } = useQuery({ queryKey: ['x'], queryFn: () => 'ok' });
  return <div>child {data}</div>;
}

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider>
        <span>hello</span>
      </QueryProvider>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('provides a working query client to descendants', async () => {
    render(
      <QueryProvider>
        <Consumer />
      </QueryProvider>,
    );
    expect(await screen.findByText(/child ok/)).toBeInTheDocument();
  });
});
