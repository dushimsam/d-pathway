import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-n100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-[24px] font-bold text-primary-dark">
            D·Pathway
          </Link>
          <p className="mt-1 text-[14px] text-n500">
            Projects for the Kigali graduate labour market
          </p>
        </div>
        <Card>
          <h1 className="text-[18px] font-semibold text-n900">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-n500">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </Card>
        {footer && (
          <p className="mt-4 text-center text-[14px] text-n500">{footer}</p>
        )}
      </div>
    </div>
  );
}
