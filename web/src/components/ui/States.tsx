import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[8px] bg-n100', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-n300 bg-n0 p-12 text-center">
      <Inbox className="h-8 w-8 text-n500" aria-hidden />
      <div>
        <p className="text-[16px] font-medium text-n900">{title}</p>
        {description && <p className="mt-1 text-[14px] text-n500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-danger-50 bg-danger-50 p-12 text-center">
      <AlertCircle className="h-8 w-8 text-danger" aria-hidden />
      <p className="text-[14px] text-danger">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
