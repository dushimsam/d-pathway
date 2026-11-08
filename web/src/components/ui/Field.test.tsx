import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './Field';

describe('Field', () => {
  it('renders the label and children', () => {
    render(
      <Field label="Email">
        <input />
      </Field>,
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('associates the label with htmlFor', () => {
    render(
      <Field label="Email" htmlFor="email">
        <input id="email" />
      </Field>,
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows the hint when there is no error', () => {
    render(
      <Field label="Email" hint="We never share it">
        <input />
      </Field>,
    );
    expect(screen.getByText('We never share it')).toBeInTheDocument();
  });

  it('hides the hint and shows the error when an error is present', () => {
    render(
      <Field label="Email" hint="We never share it" error="Required">
        <input />
      </Field>,
    );
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders neither hint nor error when both are absent', () => {
    const { container } = render(
      <Field label="Email">
        <input />
      </Field>,
    );
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('shows the error even without a hint', () => {
    render(
      <Field label="Email" error="Bad">
        <input />
      </Field>,
    );
    expect(screen.getByText('Bad')).toHaveClass('text-danger');
  });
});
