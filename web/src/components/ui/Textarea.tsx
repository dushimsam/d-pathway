import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      'w-full rounded-[8px] border border-n300 bg-n0 px-3 py-2 text-[14px] text-n900 placeholder:text-n500',
      'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50',
      'disabled:bg-n100 disabled:text-n500',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
