import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-[8px] border border-n300 bg-n0 px-3 text-[14px] text-n900 placeholder:text-n500',
      'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-50',
      'disabled:bg-n100 disabled:text-n500',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
