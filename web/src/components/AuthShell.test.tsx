import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthShell } from './AuthShell';

describe('AuthShell', () => {
  it('renders title, children and the brand perks', () => {
    render(
      <AuthShell title="Welcome back">
        <form>fields</form>
      </AuthShell>,
    );
    // title appears in the form panel heading
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('fields')).toBeInTheDocument();
    expect(
      screen.getByText('Real, bounded projects from Kigali organisations'),
    ).toBeInTheDocument();
    expect(screen.getByText('Some projects carry cash prizes')).toBeInTheDocument();
  });

  it('renders the optional subtitle and footer', () => {
    render(
      <AuthShell title="Sign up" subtitle="Create your account" footer={<span>Footer note</span>}>
        <div>body</div>
      </AuthShell>,
    );
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Footer note')).toBeInTheDocument();
  });
});
