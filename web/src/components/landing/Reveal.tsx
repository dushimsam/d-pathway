'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

type RevealVariant = 'up' | 'fade' | 'left' | 'right' | 'zoom' | 'fall';

interface RevealProps {
  children: ReactNode;
  /** Entrance style. Defaults to a gentle rise ("up"). */
  variant?: RevealVariant;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Replay the entrance every time it re-enters the viewport. */
  repeat?: boolean;
  /** Fraction of the element that must be visible before it reveals. */
  threshold?: number;
  /** Render as a different element (e.g. an `li` or `section`). */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/**
 * Wraps content in a scroll-triggered entrance. The hidden/visible states live
 * in globals.css under `html.js [data-reveal]`, so without JavaScript the page
 * degrades to fully visible, and reduced-motion users get the content instantly.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  repeat = false,
  threshold = 0.15,
  as,
  className,
  style,
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (!repeat) io.unobserve(entry.target);
          } else if (repeat) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [repeat, threshold]);

  return (
    <Tag
      ref={ref}
      data-reveal={variant === 'up' ? '' : variant}
      className={cn(inView && 'is-in', className)}
      style={delay ? { ...style, '--reveal-delay': `${delay}ms` } as CSSProperties : style}
    >
      {children}
    </Tag>
  );
}
