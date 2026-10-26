import { Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Format a prize like "RWF 150,000". */
export function formatPrize(amount: number, currency: string | null): string {
  return `${currency ?? 'RWF'} ${amount.toLocaleString('en-RW')}`;
}

export function PrizeBadge({
  amount,
  currency,
  size = 'md',
  className,
}: {
  amount: number;
  currency: string | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-warning-50 font-semibold text-warning',
        size === 'sm' ? 'px-2.5 py-0.5 text-[12px]' : 'px-3 py-1 text-[14px]',
        className,
      )}
    >
      <Trophy className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      {formatPrize(amount, currency)}
    </span>
  );
}
