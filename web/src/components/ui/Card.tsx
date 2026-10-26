import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-n0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
