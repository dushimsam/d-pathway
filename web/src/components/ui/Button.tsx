import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-n0 hover:bg-primary-dark disabled:bg-n300 disabled:text-n0',
  secondary:
    'bg-n0 text-n700 border border-n300 hover:bg-n100 disabled:text-n300',
  ghost: 'bg-transparent text-primary hover:bg-primary-50 disabled:text-n300',
  danger: 'bg-danger text-n0 hover:opacity-90 disabled:bg-n300',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[14px]',
  md: 'h-10 px-4 text-[14px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
