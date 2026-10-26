import type { ReactNode } from 'react';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-n700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] text-n500">{hint}</p>}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
