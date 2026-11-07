import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[16px] border border-n300 bg-n0 p-6 shadow-[0_10px_30px_-20px_rgba(16,32,79,0.25)]',
        className,
      )}
      {...props}
    />
  );
}
