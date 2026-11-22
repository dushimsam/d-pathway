import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalPage, LegalSection } from './LegalPage';

describe('LegalPage', () => {
  it('renders the title, the last-updated date, and the intro', () => {
    render(
      <LegalPage
        title="Privacy Policy"
        lastUpdated="20 November 2026"
        intro="This page tells you how we handle your information."
      >
        <p>body</p>
      </LegalPage>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Last updated: 20 November 2026')).toBeInTheDocument();
    expect(
      screen.getByText('This page tells you how we handle your information.'),
    ).toBeInTheDocument();
  });

  it('renders children and the footer navigation links', () => {
    render(
      <LegalPage title="Terms" lastUpdated="x">
        <p>child content</p>
      </LegalPage>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' }),
    ).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('omits the intro when it is not provided', () => {
    render(
      <LegalPage title="No Intro" lastUpdated="x">
        <p>only body</p>
      </LegalPage>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'No Intro' }),
    ).toBeInTheDocument();
    expect(screen.getByText('only body')).toBeInTheDocument();
  });
});

describe('LegalSection', () => {
  it('renders a titled section with its body', () => {
    render(
      <LegalSection title="Who are we?">
        <p>a plain answer</p>
      </LegalSection>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Who are we?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('a plain answer')).toBeInTheDocument();
  });

  it('prefixes a number when one is given', () => {
    render(
      <LegalSection n={3} title="What must companies do?">
        <p>rules</p>
      </LegalSection>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '3. What must companies do?',
    );
  });

  it('renders no number when none is given', () => {
    render(
      <LegalSection title="Plain heading">
        <p>x</p>
      </LegalSection>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Plain heading',
    );
  });
});
