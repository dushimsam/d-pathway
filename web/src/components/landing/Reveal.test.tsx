import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  afterEach(() => {
    // restore the stubbed IntersectionObserver from setup if a test removed it
    vi.unstubAllGlobals();
  });

  it('renders its children with the default "up" variant', () => {
    const { container } = render(<Reveal>Hello world</Reveal>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    const root = container.firstElementChild as HTMLElement;
    // default variant "up" renders an empty data-reveal attribute
    expect(root).toHaveAttribute('data-reveal', '');
    expect(root.tagName.toLowerCase()).toBe('div');
  });

  it('applies the given variant to data-reveal', () => {
    const { container } = render(<Reveal variant="fade">x</Reveal>);
    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'fade');
  });

  it('renders as a custom element and applies the delay style var', () => {
    const { container } = render(
      <Reveal as="section" delay={120}>
        inside
      </Reveal>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName.toLowerCase()).toBe('section');
    expect(root.style.getPropertyValue('--reveal-delay')).toBe('120ms');
  });

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<Reveal>fallback</Reveal>);
    expect(container.firstElementChild).toHaveClass('is-in');
  });

  it('observes the element when IntersectionObserver exists (repeat variant)', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe;
        unobserve = vi.fn();
        disconnect = disconnect;
        takeRecords = () => [];
      },
    );
    const { unmount } = render(
      <Reveal repeat threshold={0.5}>
        watched
      </Reveal>,
    );
    expect(observe).toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
